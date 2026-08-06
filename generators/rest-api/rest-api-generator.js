/**
 * REST API Generator — Stage 3G. Third Injection Generator.
 *
 * Unlike CPT+Taxonomy and ACF (which add a new sibling METHOD + a new hook
 * line in `register()`), this generator's target file — `Class-RestApi.php`
 * — already demonstrates a DIFFERENT convention: ONE `register_routes()`
 * method containing MULTIPLE `register_rest_route()` calls, hooked ONCE
 * via `register()`. Adding a new route means inserting a new
 * `register_rest_route()` call block into the EXISTING `register_routes()`
 * method — NOT adding a new hook to `register()` (already wired) and NOT
 * adding a new sibling method for route registration itself.
 *
 * What IS reused unchanged from CPT/ACF: the new HTTP callback method
 * (e.g. `get_events()`) is still inserted as a new sibling method before
 * the class's closing brace, via the same `insertMethodBeforeClassClose`
 * used by every Injection Generator so far.
 *
 * This split — insertBeforeMethodClose(registerRoutes) for the call block,
 * insertMethodBeforeClassClose for the callback — is why
 * `insertHookIntoRegisterMethod` was generalized into
 * `insertBeforeMethodClose` in this stage: the underlying mechanic (find a
 * method, insert before its close) is identical, but WHICH method differs
 * per target file's own real, observed convention. See
 * docs/REST-API-GENERATOR.md's Change Set evidence section for why this
 * matters to the framework-promotion question.
 *
 * Duplicate policy differs deliberately from CPT/ACF: this generator
 * REFUSES (throws) on an exact (namespace, path, method) collision rather
 * than silently skipping. Routes are identity-sensitive in a way CPT/
 * taxonomy slugs and ACF group keys aren't — a route collision is more
 * likely a genuine authoring mistake worth surfacing loudly than an
 * expected "already done" re-run.
 */

import path from "node:path";
import { toForwardSlashes } from "../framework/path-utils.js";
import { toOptionCase } from "../framework/constant-case-manager.js";
import { insertBeforeMethodClose, insertMethodBeforeClassClose } from "../framework/php-class-injector.js";
import { VARIABLE_MANIFEST } from "./variable-manifest.js";

const REST_FILE_PATH = path.join("includes", "Class-RestApi.php");
const CPT_FILE_PATH = path.join("includes", "Class-CPT.php");
// Forward-slash forms for embedding into user-facing error messages —
// the raw `path.join` forms above stay platform-specific for filesystem
// operations (see framework/path-utils.js).
const REST_FILE_PATH_DISPLAY = toForwardSlashes(REST_FILE_PATH);
const CPT_FILE_PATH_DISPLAY = toForwardSlashes(CPT_FILE_PATH);
const REGISTER_ROUTES_MARKER = "public function register_routes(): void {";

const VALID_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const ARG_TYPE_SANITIZERS = {
  integer: "absint",
  string: "sanitize_text_field",
  boolean: "rest_sanitize_boolean",
  number: "floatval",
};

function detectNamespace(content) {
  const match = /const NAMESPACE_\s*=\s*'([^']+)'/.exec(content);
  return match ? match[1] : null;
}

// Deliberately NOT a full PHP parser — same documented limitation as the
// CPT/ACF generators. Finds each register_rest_route(...) call's path and
// the 'methods' value within a bounded window after it, positionally.
function parseExistingRoutes(content) {
  const callPattern = /register_rest_route\(\s*(?:self::NAMESPACE_|'([^']+)')\s*,\s*'([^']+)'/g;
  const routes = [];
  let match;
  while ((match = callPattern.exec(content)) !== null) {
    const [fullMatch, explicitNamespace, routePath] = match;
    const windowStart = match.index + fullMatch.length;
    const window = content.slice(windowStart, windowStart + 500);
    const methodsMatch = /'methods'\s*=>\s*'([^']+)'/.exec(window);
    routes.push({
      path: routePath,
      namespace: explicitNamespace || null, // null = uses self::NAMESPACE_ (the detected default)
      methods: methodsMatch ? methodsMatch[1] : null,
    });
  }
  return routes;
}

function detectRegisteredPostTypes(cptFileContent) {
  const pattern = /register_post_type\(\s*'([a-z0-9_]+)'/g;
  const slugs = [];
  let match;
  while ((match = pattern.exec(cptFileContent)) !== null) {
    slugs.push(match[1]);
  }
  return slugs;
}

function deriveCallbackName(method, routePath) {
  // Replace each capture group with a "by-{paramName}" segment instead of
  // stripping it entirely — otherwise "/events" and "/events/(?P<id>\d+)"
  // both derive to the same "get_events", colliding on the very first pair
  // of list+single routes for the same resource.
  const withParams = routePath.replace(/\(\?P<([^>]+)>[^)]*\)/g, (_match, paramName) => `by-${paramName}`);
  const segments = withParams
    .split("/")
    .filter(Boolean)
    .map((seg) => toOptionCase(seg))
    .filter(Boolean);
  return [method.toLowerCase(), ...segments].join("_");
}

function validateArgDef(arg, index) {
  if (!arg || typeof arg.name !== "string" || arg.name.trim() === "") {
    throw new Error(`Cannot generate route: args[${index}] is missing a non-empty "name".`);
  }
  if (!arg.type || !(arg.type in ARG_TYPE_SANITIZERS)) {
    throw new Error(
      `Cannot generate route: args[${index}] ("${arg.name}") has unsupported type "${arg.type}" ` +
        `(supported: ${Object.keys(ARG_TYPE_SANITIZERS).join(", ")}).`
    );
  }
  return arg;
}

function buildArgsBlock(args) {
  if (!args || args.length === 0) return null;
  const entries = args.map((arg) => {
    const lines = [`\t\t\t\t'${arg.name}' => array(`];
    if (arg.required) lines.push(`\t\t\t\t\t'required'          => true,`);
    if (Object.prototype.hasOwnProperty.call(arg, "default")) {
      lines.push(`\t\t\t\t\t'default'           => ${JSON.stringify(arg.default)},`);
    }
    lines.push(`\t\t\t\t\t'sanitize_callback' => '${ARG_TYPE_SANITIZERS[arg.type]}',`);
    if (arg.type === "integer") {
      lines.push(
        `\t\t\t\t\t'validate_callback' => function ( $param ) {\n` +
          `\t\t\t\t\t\treturn is_numeric( $param );\n` +
          `\t\t\t\t\t},`
      );
    }
    lines.push(`\t\t\t\t),`);
    return lines.join("\n");
  });
  return `\t\t\t'args'                => array(\n${entries.join("\n")}\n\t\t\t),\n`;
}

function buildPermissionCallback(permission) {
  if (permission === "public") {
    return `\t\t\t'permission_callback' => '__return_true', // Public read endpoint.\n`;
  }
  return (
    `\t\t\t'permission_callback' => function () {\n` +
    `\t\t\t\treturn current_user_can( '${permission}' );\n` +
    `\t\t\t},\n`
  );
}

function buildRouteRegistrationBlock({ namespaceExpr, routePath, method, callbackName, permission, args }) {
  const argsBlock = buildArgsBlock(args);
  // No leading "\t\t" on the first line here — insertBeforeMethodClose
  // already prefixes the inserted text with "\n\t\t" for correct
  // indentation at the call site. Adding it here too caused a real
  // double-indentation bug found during Stage 3G smoke testing.
  return (
    `register_rest_route( ${namespaceExpr}, '${routePath}', array(\n` +
    `\t\t\t'methods'             => '${method}',\n` +
    `\t\t\t'callback'            => array( $this, '${callbackName}' ),\n` +
    buildPermissionCallback(permission) +
    (argsBlock ?? "") +
    `\t\t) );\n`
  );
}

function buildCrudCallbackBody({ method, targetCpt, includeAcf, hasIdArg }) {
  const notFoundError =
    `\t\tif ( '${targetCpt}' !== get_post_type( $id ) ) {\n` +
    `\t\t\treturn new WP_Error( 'not_found', '${targetCpt} not found.', array( 'status' => 404 ) );\n` +
    `\t\t}\n\n`;
  const idLine = `\t\t$id = (int) $request->get_param( 'id' );\n\n`;
  const acfLine = includeAcf
    ? `\t\t\t'acf' => function_exists( 'get_fields' ) ? get_fields( $post->ID ) : array(),\n`
    : "";

  if (method === "GET" && hasIdArg) {
    return (
      idLine +
      notFoundError +
      `\t\t$post = get_post( $id );\n` +
      `\t\t$data = array(\n` +
      `\t\t\t'id'    => $post->ID,\n` +
      `\t\t\t'title' => get_the_title( $post ),\n` +
      acfLine +
      `\t\t);\n\n` +
      `\t\treturn new WP_REST_Response( $data, 200 );\n`
    );
  }

  if (method === "GET") {
    return (
      `\t\t$query = new \\WP_Query( array(\n` +
      `\t\t\t'post_type'      => '${targetCpt}',\n` +
      `\t\t\t'posts_per_page' => -1,\n` +
      `\t\t) );\n\n` +
      `\t\t$data = array_map( function ( $post ) {\n` +
      `\t\t\treturn array(\n` +
      `\t\t\t\t'id'    => $post->ID,\n` +
      `\t\t\t\t'title' => get_the_title( $post ),\n` +
      `\t\t\t);\n` +
      `\t\t}, $query->posts );\n\n` +
      `\t\treturn new WP_REST_Response( $data, 200 );\n`
    );
  }

  if (method === "POST") {
    return (
      `\t\t$post_id = wp_insert_post( array(\n` +
      `\t\t\t'post_type'   => '${targetCpt}',\n` +
      `\t\t\t'post_title'  => sanitize_text_field( $request->get_param( 'title' ) ),\n` +
      `\t\t\t'post_status' => 'draft',\n` +
      `\t\t), true );\n\n` +
      `\t\tif ( is_wp_error( $post_id ) ) {\n` +
      `\t\t\treturn $post_id;\n` +
      `\t\t}\n\n` +
      `\t\treturn new WP_REST_Response( array( 'id' => $post_id ), 201 );\n`
    );
  }

  if (method === "PUT" || method === "PATCH") {
    return (
      idLine +
      notFoundError +
      `\t\t$updated = wp_update_post( array(\n` +
      `\t\t\t'ID'         => $id,\n` +
      `\t\t\t'post_title' => sanitize_text_field( $request->get_param( 'title' ) ),\n` +
      `\t\t), true );\n\n` +
      `\t\tif ( is_wp_error( $updated ) ) {\n` +
      `\t\t\treturn $updated;\n` +
      `\t\t}\n\n` +
      `\t\treturn new WP_REST_Response( array( 'id' => $id ), 200 );\n`
    );
  }

  // DELETE
  return (
    idLine +
    notFoundError +
    `\t\t$deleted = wp_delete_post( $id, true );\n\n` +
    `\t\tif ( ! $deleted ) {\n` +
    `\t\t\treturn new WP_Error( 'delete_failed', 'Could not delete ${targetCpt}.', array( 'status' => 500 ) );\n` +
    `\t\t}\n\n` +
    `\t\treturn new WP_REST_Response( null, 204 );\n`
  );
}

function buildCallbackMethod({ callbackName, method, routePath, targetCpt, includeAcf, args }) {
  const hasIdArg = args.some((a) => a.name === "id") || /\(\?P<id>/.test(routePath);
  const returnType = method === "DELETE" ? "" : ": WP_REST_Response";

  const body = targetCpt
    ? buildCrudCallbackBody({ method, targetCpt, includeAcf, hasIdArg })
    : `\t\t// TODO: implement ${method} ${routePath} logic.\n` +
      `\t\treturn new WP_REST_Response( array( 'message' => 'Not yet implemented.' ), 501 );\n`;

  return `\tpublic function ${callbackName}( WP_REST_Request $request )${returnType} {\n${body}\t}\n`;
}

/**
 * Pure transform: given config and the existing target project's files
 * (already read by the executor via analyzeOutputDir), return the files
 * to inject. No filesystem access here.
 */
export function generateRestRouteFiles(config, _templateFiles, existingFiles) {
  if (!config.route_path || typeof config.route_path !== "string" || !config.route_path.startsWith("/")) {
    throw new Error('Cannot generate route: "route_path" is required and must start with "/".');
  }
  const method = (config.method || "").toUpperCase();
  if (!VALID_METHODS.includes(method)) {
    throw new Error(`Cannot generate route: "method" must be one of ${VALID_METHODS.join(", ")}, got "${config.method}".`);
  }
  const permission = config.permission || "public";
  const args = (config.args ?? []).map((arg, index) => validateArgDef(arg, index));

  const restFile = (existingFiles ?? []).find((f) => f.path === REST_FILE_PATH);
  if (!restFile) {
    throw new Error(
      `Cannot inject route: target project is missing ${REST_FILE_PATH_DISPLAY}. This generator targets ` +
        "plugins produced by this framework's Plugin Generator (Stage 3B) — is outputDir pointed at one?"
    );
  }

  if (config.target_cpt) {
    const cptFile = (existingFiles ?? []).find((f) => f.path === CPT_FILE_PATH);
    if (!cptFile) {
      throw new Error(`Cannot inject route: target_cpt was given but ${CPT_FILE_PATH_DISPLAY} is missing from the target.`);
    }
    const registeredPostTypes = detectRegisteredPostTypes(cptFile.content);
    if (!registeredPostTypes.includes(config.target_cpt)) {
      throw new Error(
        `Cannot inject route: target_cpt "${config.target_cpt}" is not registered in ${CPT_FILE_PATH_DISPLAY} ` +
          `(found: ${registeredPostTypes.join(", ") || "none"}).`
      );
    }
  }

  const detectedNamespace = detectNamespace(restFile.content);
  if (!detectedNamespace) {
    throw new Error(`Cannot inject route: could not detect the target's REST namespace from ${REST_FILE_PATH_DISPLAY}.`);
  }
  const effectiveNamespace = config.namespace || detectedNamespace;
  const usesDefaultNamespace = effectiveNamespace === detectedNamespace;
  const namespaceExpr = usesDefaultNamespace ? "self::NAMESPACE_" : `'${effectiveNamespace}'`;

  // Refuse (not skip) on an exact (namespace, path, method) collision —
  // see file header for why this differs from CPT/ACF's idempotent skip.
  const existingRoutes = parseExistingRoutes(restFile.content);
  const collision = existingRoutes.find((r) => {
    const rEffectiveNamespace = r.namespace || detectedNamespace;
    return rEffectiveNamespace === effectiveNamespace && r.path === config.route_path && r.methods === method;
  });
  if (collision) {
    throw new Error(
      `Cannot inject route: "${method} ${config.route_path}" is already registered under namespace ` +
        `"${effectiveNamespace}". Refusing to create a duplicate route — choose a different path/method ` +
        "or remove the existing registration first."
    );
  }

  const callbackName = config.callback_name || deriveCallbackName(method, config.route_path);
  if (restFile.content.includes(`function ${callbackName}(`)) {
    throw new Error(
      `Cannot inject route: a callback method named "${callbackName}" already exists in ${REST_FILE_PATH_DISPLAY}. ` +
        "Provide an explicit callback_name to avoid the collision."
    );
  }

  const routeBlock = buildRouteRegistrationBlock({
    namespaceExpr,
    routePath: config.route_path,
    method,
    callbackName,
    permission,
    args,
  });
  const callbackMethod = buildCallbackMethod({
    callbackName,
    method,
    routePath: config.route_path,
    targetCpt: config.target_cpt || null,
    includeAcf: Boolean(config.include_acf),
    args,
  });

  const withRoute = insertBeforeMethodClose(restFile.content, REGISTER_ROUTES_MARKER, routeBlock);
  const finalContent = insertMethodBeforeClassClose(withRoute, callbackMethod);

  return [{ path: REST_FILE_PATH, content: finalContent, operation: "modify" }];
}

export const restApiGenerator = {
  id: "rest-api",
  name: "REST API Generator",
  version: "1.0.0",
  category: "capability",
  description:
    "Injects a new custom REST API route into an EXISTING plugin generated by the Plugin " +
    "Generator — adds a new register_rest_route() call to its existing register_routes() " +
    "method and a new callback method, with permission checks and arg validation/sanitization.",
  supportedOutputs: ["php-rest-route"],
  minimumFrameworkVersion: "1.1.0",
  variableManifest: VARIABLE_MANIFEST,
  analyzeOutputDir: true,
  configSchema: {
    fields: [
      { name: "route_path", type: "string", required: true, description: "Route path, e.g. '/events/(?P<id>\\d+)'." },
      { name: "method", type: "string", required: true, description: "One of GET, POST, PUT, PATCH, DELETE." },
      { name: "namespace", type: "string", required: false, description: "Overrides the detected default namespace/version." },
      { name: "permission", type: "string", required: false, description: "'public' or a WP capability string. Defaults to 'public'." },
      { name: "callback_name", type: "string", required: false, description: "Overrides the derived callback method name." },
      { name: "args", required: false, description: "Array of { name, type, required?, default? }." },
      { name: "target_cpt", type: "string", required: false, description: "Generates a full CRUD callback body for this CPT if given." },
      { name: "include_acf", type: "boolean", required: false, description: "Include ACF field data in GET responses." },
    ],
  },
  generate: generateRestRouteFiles,
};

export { VARIABLE_MANIFEST };
