let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}


const heap = new Array(128).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachedUint8Memory0 = null;

function getUint8Memory0() {
    if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

let cachedFloat64Memory0 = null;

function getFloat64Memory0() {
    if (cachedFloat64Memory0 === null || cachedFloat64Memory0.byteLength === 0) {
        cachedFloat64Memory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64Memory0;
}

let cachedInt32Memory0 = null;

function getInt32Memory0() {
    if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}

let WASM_VECTOR_LEN = 0;

const lTextEncoder = typeof TextEncoder === 'undefined' ? (0, module.require)('util').TextEncoder : TextEncoder;

let cachedTextEncoder = new lTextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedBigInt64Memory0 = null;

function getBigInt64Memory0() {
    if (cachedBigInt64Memory0 === null || cachedBigInt64Memory0.byteLength === 0) {
        cachedBigInt64Memory0 = new BigInt64Array(wasm.memory.buffer);
    }
    return cachedBigInt64Memory0;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

const CLOSURE_DTORS = new FinalizationRegistry(state => {
    wasm.__wbindgen_export_2.get(state.dtor)(state.a, state.b)
});

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {
        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_2.get(state.dtor)(a, state.b);
                CLOSURE_DTORS.unregister(state)
            } else {
                state.a = a;
            }
        }
    };
    real.original = state;
    CLOSURE_DTORS.register(real, state, state);
    return real;
}
function __wbg_adapter_50(arg0, arg1, arg2) {
    wasm.wasm_bindgen__convert__closures__invoke1_mut__h235137cd17332523(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_53(arg0, arg1) {
    wasm.wasm_bindgen__convert__closures__invoke0_mut__hfe1bbe6928fb8edb(arg0, arg1);
}

function __wbg_adapter_56(arg0, arg1) {
    wasm._dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h51d852193a44952a(arg0, arg1);
}

let stack_pointer = 128;

function addBorrowedObject(obj) {
    if (stack_pointer == 1) throw new Error('out of js stack');
    heap[--stack_pointer] = obj;
    return stack_pointer;
}
function __wbg_adapter_59(arg0, arg1, arg2) {
    try {
        wasm._dyn_core__ops__function__FnMut___A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__habbb518e4ef9bcbf(arg0, arg1, addBorrowedObject(arg2));
    } finally {
        heap[stack_pointer++] = undefined;
    }
}

function __wbg_adapter_62(arg0, arg1, arg2) {
    wasm.wasm_bindgen__convert__closures__invoke1_mut__h2fc23feb0e10982e(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_65(arg0, arg1, arg2) {
    wasm.wasm_bindgen__convert__closures__invoke1_mut__hea627ba13712ea21(arg0, arg1, addHeapObject(arg2));
}

/**
*/
export function initialize_veilid_wasm() {
    wasm.initialize_veilid_wasm();
}

/**
* @param {string} platform_config
*/
export function initialize_veilid_core(platform_config) {
    const ptr0 = passStringToWasm0(platform_config, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.initialize_veilid_core(ptr0, len0);
}

/**
* @param {string} layer
* @param {string} log_level
*/
export function change_log_level(layer, log_level) {
    const ptr0 = passStringToWasm0(layer, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(log_level, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    wasm.change_log_level(ptr0, len0, ptr1, len1);
}

/**
* @param {Function} update_callback_js
* @param {string} json_config
* @returns {Promise<any>}
*/
export function startup_veilid_core(update_callback_js, json_config) {
    const ptr0 = passStringToWasm0(json_config, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.startup_veilid_core(addHeapObject(update_callback_js), ptr0, len0);
    return takeObject(ret);
}

/**
* @returns {Promise<any>}
*/
export function get_veilid_state() {
    const ret = wasm.get_veilid_state();
    return takeObject(ret);
}

/**
* @returns {Promise<any>}
*/
export function attach() {
    const ret = wasm.attach();
    return takeObject(ret);
}

/**
* @returns {Promise<any>}
*/
export function detach() {
    const ret = wasm.detach();
    return takeObject(ret);
}

/**
* @returns {Promise<any>}
*/
export function shutdown_veilid_core() {
    const ret = wasm.shutdown_veilid_core();
    return takeObject(ret);
}

/**
* @returns {Promise<any>}
*/
export function routing_context() {
    const ret = wasm.routing_context();
    return takeObject(ret);
}

/**
* @param {number} id
* @returns {number}
*/
export function release_routing_context(id) {
    const ret = wasm.release_routing_context(id);
    return ret;
}

/**
* @param {number} id
* @returns {number}
*/
export function routing_context_with_default_safety(id) {
    const ret = wasm.routing_context_with_default_safety(id);
    return ret >>> 0;
}

/**
* @param {number} id
* @param {string} safety_selection
* @returns {number}
*/
export function routing_context_with_safety(id, safety_selection) {
    const ptr0 = passStringToWasm0(safety_selection, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.routing_context_with_safety(id, ptr0, len0);
    return ret >>> 0;
}

/**
* @param {number} id
* @param {string} sequencing
* @returns {number}
*/
export function routing_context_with_sequencing(id, sequencing) {
    const ptr0 = passStringToWasm0(sequencing, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.routing_context_with_sequencing(id, ptr0, len0);
    return ret >>> 0;
}

/**
* @param {number} id
* @returns {Promise<any>}
*/
export function routing_context_safety(id) {
    const ret = wasm.routing_context_safety(id);
    return takeObject(ret);
}

/**
* @param {number} id
* @param {string} target_string
* @param {string} request
* @returns {Promise<any>}
*/
export function routing_context_app_call(id, target_string, request) {
    const ptr0 = passStringToWasm0(target_string, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(request, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.routing_context_app_call(id, ptr0, len0, ptr1, len1);
    return takeObject(ret);
}

/**
* @param {number} id
* @param {string} target_string
* @param {string} message
* @returns {Promise<any>}
*/
export function routing_context_app_message(id, target_string, message) {
    const ptr0 = passStringToWasm0(target_string, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(message, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.routing_context_app_message(id, ptr0, len0, ptr1, len1);
    return takeObject(ret);
}

/**
* @param {number} id
* @param {string} schema
* @param {number} kind
* @returns {Promise<any>}
*/
export function routing_context_create_dht_record(id, schema, kind) {
    const ptr0 = passStringToWasm0(schema, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.routing_context_create_dht_record(id, ptr0, len0, kind);
    return takeObject(ret);
}

/**
* @param {number} id
* @param {string} key
* @param {string | undefined} [writer]
* @returns {Promise<any>}
*/
export function routing_context_open_dht_record(id, key, writer) {
    const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    var ptr1 = isLikeNone(writer) ? 0 : passStringToWasm0(writer, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    const ret = wasm.routing_context_open_dht_record(id, ptr0, len0, ptr1, len1);
    return takeObject(ret);
}

/**
* @param {number} id
* @param {string} key
* @returns {Promise<any>}
*/
export function routing_context_close_dht_record(id, key) {
    const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.routing_context_close_dht_record(id, ptr0, len0);
    return takeObject(ret);
}

/**
* @param {number} id
* @param {string} key
* @returns {Promise<any>}
*/
export function routing_context_delete_dht_record(id, key) {
    const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.routing_context_delete_dht_record(id, ptr0, len0);
    return takeObject(ret);
}

/**
* @param {number} id
* @param {string} key
* @param {number} subkey
* @param {boolean} force_refresh
* @returns {Promise<any>}
*/
export function routing_context_get_dht_value(id, key, subkey, force_refresh) {
    const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.routing_context_get_dht_value(id, ptr0, len0, subkey, force_refresh);
    return takeObject(ret);
}

/**
* @param {number} id
* @param {string} key
* @param {number} subkey
* @param {string} data
* @returns {Promise<any>}
*/
export function routing_context_set_dht_value(id, key, subkey, data) {
    const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(data, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.routing_context_set_dht_value(id, ptr0, len0, subkey, ptr1, len1);
    return takeObject(ret);
}

/**
* @param {number} id
* @param {string} key
* @param {string} subkeys
* @param {string} expiration
* @param {number} count
* @returns {Promise<any>}
*/
export function routing_context_watch_dht_values(id, key, subkeys, expiration, count) {
    const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(subkeys, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(expiration, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    const ret = wasm.routing_context_watch_dht_values(id, ptr0, len0, ptr1, len1, ptr2, len2, count);
    return takeObject(ret);
}

/**
* @param {number} id
* @param {string} key
* @param {string} subkeys
* @returns {Promise<any>}
*/
export function routing_context_cancel_dht_watch(id, key, subkeys) {
    const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(subkeys, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.routing_context_cancel_dht_watch(id, ptr0, len0, ptr1, len1);
    return takeObject(ret);
}

/**
* @returns {Promise<any>}
*/
export function new_private_route() {
    const ret = wasm.new_private_route();
    return takeObject(ret);
}

/**
* @param {string} stability
* @param {string} sequencing
* @returns {Promise<any>}
*/
export function new_custom_private_route(stability, sequencing) {
    const ptr0 = passStringToWasm0(stability, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(sequencing, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.new_custom_private_route(ptr0, len0, ptr1, len1);
    return takeObject(ret);
}

/**
* @param {string} blob
* @returns {Promise<any>}
*/
export function import_remote_private_route(blob) {
    const ptr0 = passStringToWasm0(blob, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.import_remote_private_route(ptr0, len0);
    return takeObject(ret);
}

/**
* @param {string} route_id
* @returns {Promise<any>}
*/
export function release_private_route(route_id) {
    const ptr0 = passStringToWasm0(route_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.release_private_route(ptr0, len0);
    return takeObject(ret);
}

/**
* @param {string} call_id
* @param {string} message
* @returns {Promise<any>}
*/
export function app_call_reply(call_id, message) {
    const ptr0 = passStringToWasm0(call_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(message, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.app_call_reply(ptr0, len0, ptr1, len1);
    return takeObject(ret);
}

/**
* @param {string} name
* @param {number} column_count
* @returns {Promise<any>}
*/
export function open_table_db(name, column_count) {
    const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.open_table_db(ptr0, len0, column_count);
    return takeObject(ret);
}

/**
* @param {number} id
* @returns {number}
*/
export function release_table_db(id) {
    const ret = wasm.release_table_db(id);
    return ret;
}

/**
* @param {string} name
* @returns {Promise<any>}
*/
export function delete_table_db(name) {
    const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.delete_table_db(ptr0, len0);
    return takeObject(ret);
}

/**
* @param {number} id
* @returns {number}
*/
export function table_db_get_column_count(id) {
    const ret = wasm.table_db_get_column_count(id);
    return ret >>> 0;
}

/**
* @param {number} id
* @param {number} col
* @returns {Promise<any>}
*/
export function table_db_get_keys(id, col) {
    const ret = wasm.table_db_get_keys(id, col);
    return takeObject(ret);
}

/**
* @param {number} id
* @returns {number}
*/
export function table_db_transact(id) {
    const ret = wasm.table_db_transact(id);
    return ret >>> 0;
}

/**
* @param {number} id
* @returns {number}
*/
export function release_table_db_transaction(id) {
    const ret = wasm.release_table_db_transaction(id);
    return ret;
}

/**
* @param {number} id
* @returns {Promise<any>}
*/
export function table_db_transaction_commit(id) {
    const ret = wasm.table_db_transaction_commit(id);
    return takeObject(ret);
}

/**
* @param {number} id
* @returns {Promise<any>}
*/
export function table_db_transaction_rollback(id) {
    const ret = wasm.table_db_transaction_rollback(id);
    return takeObject(ret);
}

/**
* @param {number} id
* @param {number} col
* @param {string} key
* @param {string} value
* @returns {Promise<any>}
*/
export function table_db_transaction_store(id, col, key, value) {
    const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.table_db_transaction_store(id, col, ptr0, len0, ptr1, len1);
    return takeObject(ret);
}

/**
* @param {number} id
* @param {number} col
* @param {string} key
* @returns {Promise<any>}
*/
export function table_db_transaction_delete(id, col, key) {
    const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.table_db_transaction_delete(id, col, ptr0, len0);
    return takeObject(ret);
}

/**
* @param {number} id
* @param {number} col
* @param {string} key
* @param {string} value
* @returns {Promise<any>}
*/
export function table_db_store(id, col, key, value) {
    const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.table_db_store(id, col, ptr0, len0, ptr1, len1);
    return takeObject(ret);
}

/**
* @param {number} id
* @param {number} col
* @param {string} key
* @returns {Promise<any>}
*/
export function table_db_load(id, col, key) {
    const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.table_db_load(id, col, ptr0, len0);
    return takeObject(ret);
}

/**
* @param {number} id
* @param {number} col
* @param {string} key
* @returns {Promise<any>}
*/
export function table_db_delete(id, col, key) {
    const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.table_db_delete(id, col, ptr0, len0);
    return takeObject(ret);
}

/**
* @returns {string}
*/
export function valid_crypto_kinds() {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.valid_crypto_kinds(retptr);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
* @returns {number}
*/
export function best_crypto_kind() {
    const ret = wasm.best_crypto_kind();
    return ret >>> 0;
}

/**
* @param {string} node_ids
* @param {string} data
* @param {string} signatures
* @returns {Promise<any>}
*/
export function verify_signatures(node_ids, data, signatures) {
    const ptr0 = passStringToWasm0(node_ids, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(data, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(signatures, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    const ret = wasm.verify_signatures(ptr0, len0, ptr1, len1, ptr2, len2);
    return takeObject(ret);
}

/**
* @param {string} data
* @param {string} key_pairs
* @returns {Promise<any>}
*/
export function generate_signatures(data, key_pairs) {
    const ptr0 = passStringToWasm0(data, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(key_pairs, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.generate_signatures(ptr0, len0, ptr1, len1);
    return takeObject(ret);
}

/**
* @param {number} kind
* @returns {Promise<any>}
*/
export function generate_key_pair(kind) {
    const ret = wasm.generate_key_pair(kind);
    return takeObject(ret);
}

/**
* @param {number} kind
* @param {string} key
* @param {string} secret
* @returns {Promise<any>}
*/
export function crypto_cached_dh(kind, key, secret) {
    const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(secret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.crypto_cached_dh(kind, ptr0, len0, ptr1, len1);
    return takeObject(ret);
}

/**
* @param {number} kind
* @param {string} key
* @param {string} secret
* @returns {Promise<any>}
*/
export function crypto_compute_dh(kind, key, secret) {
    const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(secret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.crypto_compute_dh(kind, ptr0, len0, ptr1, len1);
    return takeObject(ret);
}

/**
* @param {number} kind
* @param {number} len
* @returns {Promise<any>}
*/
export function crypto_random_bytes(kind, len) {
    const ret = wasm.crypto_random_bytes(kind, len);
    return takeObject(ret);
}

/**
* @param {number} kind
* @returns {Promise<any>}
*/
export function crypto_default_salt_length(kind) {
    const ret = wasm.crypto_default_salt_length(kind);
    return takeObject(ret);
}

/**
* @param {number} kind
* @param {string} password
* @param {string} salt
* @returns {Promise<any>}
*/
export function crypto_hash_password(kind, password, salt) {
    const ptr0 = passStringToWasm0(password, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(salt, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.crypto_hash_password(kind, ptr0, len0, ptr1, len1);
    return takeObject(ret);
}

/**
* @param {number} kind
* @param {string} password
* @param {string} password_hash
* @returns {Promise<any>}
*/
export function crypto_verify_password(kind, password, password_hash) {
    const ptr0 = passStringToWasm0(password, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(password_hash, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.crypto_verify_password(kind, ptr0, len0, ptr1, len1);
    return takeObject(ret);
}

/**
* @param {number} kind
* @param {string} password
* @param {string} salt
* @returns {Promise<any>}
*/
export function crypto_derive_shared_secret(kind, password, salt) {
    const ptr0 = passStringToWasm0(password, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(salt, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.crypto_derive_shared_secret(kind, ptr0, len0, ptr1, len1);
    return takeObject(ret);
}

/**
* @param {number} kind
* @returns {Promise<any>}
*/
export function crypto_random_nonce(kind) {
    const ret = wasm.crypto_random_nonce(kind);
    return takeObject(ret);
}

/**
* @param {number} kind
* @returns {Promise<any>}
*/
export function crypto_random_shared_secret(kind) {
    const ret = wasm.crypto_random_shared_secret(kind);
    return takeObject(ret);
}

/**
* @param {number} kind
* @returns {Promise<any>}
*/
export function crypto_generate_key_pair(kind) {
    const ret = wasm.crypto_generate_key_pair(kind);
    return takeObject(ret);
}

/**
* @param {number} kind
* @param {string} data
* @returns {Promise<any>}
*/
export function crypto_generate_hash(kind, data) {
    const ptr0 = passStringToWasm0(data, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.crypto_generate_hash(kind, ptr0, len0);
    return takeObject(ret);
}

/**
* @param {number} kind
* @param {string} key
* @param {string} secret
* @returns {Promise<any>}
*/
export function crypto_validate_key_pair(kind, key, secret) {
    const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(secret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.crypto_validate_key_pair(kind, ptr0, len0, ptr1, len1);
    return takeObject(ret);
}

/**
* @param {number} kind
* @param {string} data
* @param {string} hash
* @returns {Promise<any>}
*/
export function crypto_validate_hash(kind, data, hash) {
    const ptr0 = passStringToWasm0(data, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(hash, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.crypto_validate_hash(kind, ptr0, len0, ptr1, len1);
    return takeObject(ret);
}

/**
* @param {number} kind
* @param {string} key1
* @param {string} key2
* @returns {Promise<any>}
*/
export function crypto_distance(kind, key1, key2) {
    const ptr0 = passStringToWasm0(key1, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(key2, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.crypto_distance(kind, ptr0, len0, ptr1, len1);
    return takeObject(ret);
}

/**
* @param {number} kind
* @param {string} key
* @param {string} secret
* @param {string} data
* @returns {Promise<any>}
*/
export function crypto_sign(kind, key, secret, data) {
    const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(secret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(data, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    const ret = wasm.crypto_sign(kind, ptr0, len0, ptr1, len1, ptr2, len2);
    return takeObject(ret);
}

/**
* @param {number} kind
* @param {string} key
* @param {string} data
* @param {string} signature
* @returns {Promise<any>}
*/
export function crypto_verify(kind, key, data, signature) {
    const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(data, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(signature, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    const ret = wasm.crypto_verify(kind, ptr0, len0, ptr1, len1, ptr2, len2);
    return takeObject(ret);
}

/**
* @param {number} kind
* @returns {Promise<any>}
*/
export function crypto_aead_overhead(kind) {
    const ret = wasm.crypto_aead_overhead(kind);
    return takeObject(ret);
}

/**
* @param {number} kind
* @param {string} body
* @param {string} nonce
* @param {string} shared_secret
* @param {string | undefined} [associated_data]
* @returns {Promise<any>}
*/
export function crypto_decrypt_aead(kind, body, nonce, shared_secret, associated_data) {
    const ptr0 = passStringToWasm0(body, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(nonce, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(shared_secret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    var ptr3 = isLikeNone(associated_data) ? 0 : passStringToWasm0(associated_data, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len3 = WASM_VECTOR_LEN;
    const ret = wasm.crypto_decrypt_aead(kind, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
    return takeObject(ret);
}

/**
* @param {number} kind
* @param {string} body
* @param {string} nonce
* @param {string} shared_secret
* @param {string | undefined} [associated_data]
* @returns {Promise<any>}
*/
export function crypto_encrypt_aead(kind, body, nonce, shared_secret, associated_data) {
    const ptr0 = passStringToWasm0(body, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(nonce, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(shared_secret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    var ptr3 = isLikeNone(associated_data) ? 0 : passStringToWasm0(associated_data, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len3 = WASM_VECTOR_LEN;
    const ret = wasm.crypto_encrypt_aead(kind, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
    return takeObject(ret);
}

/**
* @param {number} kind
* @param {string} body
* @param {string} nonce
* @param {string} shared_secret
* @returns {Promise<any>}
*/
export function crypto_crypt_no_auth(kind, body, nonce, shared_secret) {
    const ptr0 = passStringToWasm0(body, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(nonce, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(shared_secret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    const ret = wasm.crypto_crypt_no_auth(kind, ptr0, len0, ptr1, len1, ptr2, len2);
    return takeObject(ret);
}

/**
* @returns {string}
*/
export function now() {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.now(retptr);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
* @param {string} command
* @returns {Promise<any>}
*/
export function debug(command) {
    const ptr0 = passStringToWasm0(command, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.debug(ptr0, len0);
    return takeObject(ret);
}

/**
* @returns {string}
*/
export function veilid_version_string() {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.veilid_version_string(retptr);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
* @returns {any}
*/
export function veilid_version() {
    const ret = wasm.veilid_version();
    return takeObject(ret);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8Memory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_exn_store(addHeapObject(e));
    }
}
function __wbg_adapter_422(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen__convert__closures__invoke2_mut__h40ab5bc65c8acb7a(arg0, arg1, addHeapObject(arg2), addHeapObject(arg3));
}

const VeilidRoutingContextFinalization = new FinalizationRegistry(ptr => wasm.__wbg_veilidroutingcontext_free(ptr >>> 0));
/**
*/
export class VeilidRoutingContext {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(VeilidRoutingContext.prototype);
        obj.__wbg_ptr = ptr;
        VeilidRoutingContextFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        VeilidRoutingContextFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_veilidroutingcontext_free(ptr);
    }
    /**
    * Create a new VeilidRoutingContext, without any privacy or sequencing settings.
    */
    constructor() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.veilidroutingcontext_create(retptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Same as `new VeilidRoutingContext()` except easier to chain.
    * @returns {VeilidRoutingContext}
    */
    static create() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.veilidroutingcontext_create(retptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return VeilidRoutingContext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Allocate a new private route set with default cryptography and network options.
    * Returns a route id and a publishable 'blob' with the route encrypted with each crypto kind.
    * Those nodes importing the blob will have their choice of which crypto kind to use.
    *
    * Returns a route id and 'blob' that can be published over some means (DHT or otherwise) to be imported by another Veilid node.
    * @returns {Promise<VeilidRouteBlob>}
    */
    static newPrivateRoute() {
        const ret = wasm.veilidroutingcontext_newPrivateRoute();
        return takeObject(ret);
    }
    /**
    * Import a private route blob as a remote private route.
    *
    * Returns a route id that can be used to send private messages to the node creating this route.
    * @param {string} blob
    * @returns {CryptoKey}
    */
    importRemotePrivateRoute(blob) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(blob, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.veilidroutingcontext_importRemotePrivateRoute(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Allocate a new private route and specify a specific cryptosystem, stability and sequencing preference.
    * Returns a route id and a publishable 'blob' with the route encrypted with each crypto kind.
    * Those nodes importing the blob will have their choice of which crypto kind to use.
    *
    * Returns a route id and 'blob' that can be published over some means (DHT or otherwise) to be imported by another Veilid node.
    * @param {Stability} stability
    * @param {Sequencing} sequencing
    * @returns {Promise<VeilidRouteBlob>}
    */
    static newCustomPrivateRoute(stability, sequencing) {
        const ret = wasm.veilidroutingcontext_newCustomPrivateRoute(addHeapObject(stability), addHeapObject(sequencing));
        return takeObject(ret);
    }
    /**
    * Release either a locally allocated or remotely imported private route.
    *
    * This will deactivate the route and free its resources and it can no longer be sent to or received from.
    * @param {string} route_id
    */
    static releasePrivateRoute(route_id) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(route_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.veilidroutingcontext_releasePrivateRoute(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Respond to an AppCall received over a VeilidUpdate::AppCall.
    *
    * * `call_id` - specifies which call to reply to, and it comes from a VeilidUpdate::AppCall, specifically the VeilidAppCall::id() value.
    * * `message` - is an answer blob to be returned by the remote node's RoutingContext::app_call() function, and may be up to 32768 bytes
    * @param {string} call_id
    * @param {Uint8Array} message
    * @returns {Promise<void>}
    */
    static appCallReply(call_id, message) {
        const ptr0 = passStringToWasm0(call_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(message, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.veilidroutingcontext_appCallReply(ptr0, len0, ptr1, len1);
        return takeObject(ret);
    }
    /**
    * Turn on sender privacy, enabling the use of safety routes. This is the default and
    * calling this function is only necessary if you have previously disable safety or used other parameters.
    * Returns a new instance of VeilidRoutingContext - does not mutate.
    *
    * Default values for hop count, stability and sequencing preferences are used.
    *
    * * Hop count default is dependent on config, but is set to 1 extra hop.
    * * Stability default is to choose 'low latency' routes, preferring them over long-term reliability.
    * * Sequencing default is to have no preference for ordered vs unordered message delivery
    *
    * To customize the safety selection in use, use [VeilidRoutingContext::withSafety].
    * @returns {VeilidRoutingContext}
    */
    withDefaultSafety() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.veilidroutingcontext_withDefaultSafety(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return VeilidRoutingContext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Use a custom [SafetySelection]. Can be used to disable safety via [SafetySelection::Unsafe]
    * Returns a new instance of VeilidRoutingContext - does not mutate.
    * @param {SafetySelection} safety_selection
    * @returns {VeilidRoutingContext}
    */
    withSafety(safety_selection) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.veilidroutingcontext_withSafety(retptr, this.__wbg_ptr, addHeapObject(safety_selection));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return VeilidRoutingContext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Use a specified `Sequencing` preference.
    * Returns a new instance of VeilidRoutingContext - does not mutate.
    * @param {Sequencing} sequencing
    * @returns {VeilidRoutingContext}
    */
    withSequencing(sequencing) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.veilidroutingcontext_withSequencing(retptr, this.__wbg_ptr, addHeapObject(sequencing));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return VeilidRoutingContext.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Get the safety selection in use on this routing context
    * @returns the SafetySelection currently in use if successful.
    * @returns {SafetySelection}
    */
    safety() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.veilidroutingcontext_safety(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * App-level unidirectional message that does not expect any value to be returned.
    *
    * Veilid apps may use this for arbitrary message passing.
    *
    * @param {string} target - can be either a direct node id or a private route.
    * @param {string} message - an arbitrary message blob of up to `32768` bytes.
    */
    appMessage(target_string, message) {
        const ptr0 = passStringToWasm0(target_string, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(message, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.veilidroutingcontext_appMessage(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return takeObject(ret);
    }
    /**
    * App-level bidirectional call that expects a response to be returned.
    *
    * Veilid apps may use this for arbitrary message passing.
    *
    * @param {string} target_string - can be either a direct node id or a private route.
    * @param {Uint8Array} message - an arbitrary message blob of up to `32768` bytes.
    * @returns {Uint8Array} an answer blob of up to `32768` bytes.
    */
    appCall(target_string, request) {
        const ptr0 = passStringToWasm0(target_string, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(request, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.veilidroutingcontext_appCall(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return takeObject(ret);
    }
    /**
    * DHT Records Creates a new DHT record a specified crypto kind and schema
    *
    * The record is considered 'open' after the create operation succeeds.
    *
    * @returns the newly allocated DHT record's key if successful.
    * @param {DHTSchema} schema
    * @param {string} kind
    * @returns {Promise<DHTRecordDescriptor>}
    */
    createDhtRecord(schema, kind) {
        const ptr0 = passStringToWasm0(kind, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.veilidroutingcontext_createDhtRecord(this.__wbg_ptr, addHeapObject(schema), ptr0, len0);
        return takeObject(ret);
    }
    /**
    * Opens a DHT record at a specific key.
    *
    * Associates a secret if one is provided to provide writer capability. Records may only be opened or created. To re-open with a different routing context, first close the value.
    *
    * @returns the DHT record descriptor for the opened record if successful.
    * @param {string} writer - Stringified key pair, in the form of `key:secret` where `key` and `secret` are base64Url encoded.
    * @param {string} key - key of the DHT record.
    */
    openDhtRecord(key, writer) {
        const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(writer) ? 0 : passStringToWasm0(writer, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        const ret = wasm.veilidroutingcontext_openDhtRecord(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return takeObject(ret);
    }
    /**
    * Closes a DHT record at a specific key that was opened with create_dht_record or open_dht_record.
    *
    * Closing a record allows you to re-open it with a different routing context
    * @param {string} key
    * @returns {Promise<void>}
    */
    closeDhtRecord(key) {
        const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.veilidroutingcontext_closeDhtRecord(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
    * Deletes a DHT record at a specific key
    *
    * If the record is opened, it must be closed before it is deleted.
    * Deleting a record does not delete it from the network, but will remove the storage of the record locally,
    * and will prevent its value from being refreshed on the network by this node.
    * @param {string} key
    * @returns {Promise<void>}
    */
    deleteDhtRecord(key) {
        const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.veilidroutingcontext_deleteDhtRecord(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
    * Gets the latest value of a subkey.
    *
    * May pull the latest value from the network, but by settings 'force_refresh' you can force a network data refresh.
    *
    * Returns `undefined` if the value subkey has not yet been set.
    * Returns a Uint8Array of `data` if the value subkey has valid data.
    * @param {string} key
    * @param {number} subKey
    * @param {boolean} forceRefresh
    * @returns {Promise<ValueData | undefined>}
    */
    getDhtValue(key, subKey, forceRefresh) {
        const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.veilidroutingcontext_getDhtValue(this.__wbg_ptr, ptr0, len0, subKey, forceRefresh);
        return takeObject(ret);
    }
    /**
    * Pushes a changed subkey value to the network
    *
    * Returns `undefined` if the value was successfully put.
    * Returns a Uint8Array of `data` if the value put was older than the one available on the network.
    * @param {string} key
    * @param {number} subKey
    * @param {Uint8Array} data
    * @returns {Promise<ValueData | undefined>}
    */
    setDhtValue(key, subKey, data) {
        const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.veilidroutingcontext_setDhtValue(this.__wbg_ptr, ptr0, len0, subKey, ptr1, len1);
        return takeObject(ret);
    }
}

const VeilidTableDBFinalization = new FinalizationRegistry(ptr => wasm.__wbg_veilidtabledb_free(ptr >>> 0));
/**
*/
export class VeilidTableDB {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        VeilidTableDBFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_veilidtabledb_free(ptr);
    }
    /**
    * If the column count is greater than an existing TableDB's column count,
    * the database will be upgraded to add the missing columns.
    * @param {string} tableName
    * @param {number} columnCount
    */
    constructor(tableName, columnCount) {
        const ptr0 = passStringToWasm0(tableName, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.veilidtabledb_new(ptr0, len0, columnCount);
        this.__wbg_ptr = ret >>> 0;
        return this;
    }
    /**
    * Get or create the TableDB database table.
    * This is called automatically when performing actions on the TableDB.
    * @returns {Promise<void>}
    */
    openTable() {
        const ret = wasm.veilidtabledb_openTable(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * Delete this TableDB.
    * @returns {Promise<boolean>}
    */
    deleteTable() {
        const ret = wasm.veilidtabledb_deleteTable(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * Read a key from a column in the TableDB immediately.
    * @param {number} columnId
    * @param {Uint8Array} key
    * @returns {Promise<Uint8Array | undefined>}
    */
    load(columnId, key) {
        const ptr0 = passArray8ToWasm0(key, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.veilidtabledb_load(this.__wbg_ptr, columnId, ptr0, len0);
        return takeObject(ret);
    }
    /**
    * Store a key with a value in a column in the TableDB.
    * Performs a single transaction immediately.
    * @param {number} columnId
    * @param {Uint8Array} key
    * @param {Uint8Array} value
    * @returns {Promise<void>}
    */
    store(columnId, key, value) {
        const ptr0 = passArray8ToWasm0(key, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(value, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.veilidtabledb_store(this.__wbg_ptr, columnId, ptr0, len0, ptr1, len1);
        return takeObject(ret);
    }
    /**
    * Delete key with from a column in the TableDB.
    * @param {number} columnId
    * @param {Uint8Array} key
    * @returns {Promise<Uint8Array | undefined>}
    */
    delete(columnId, key) {
        const ptr0 = passArray8ToWasm0(key, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.veilidtabledb_delete(this.__wbg_ptr, columnId, ptr0, len0);
        return takeObject(ret);
    }
    /**
    * Get the list of keys in a column of the TableDB.
    *
    * Returns an array of Uint8Array keys.
    * @param {number} columnId
    * @returns {Promise<Uint8Array[]>}
    */
    getKeys(columnId) {
        const ret = wasm.veilidtabledb_getKeys(this.__wbg_ptr, columnId);
        return takeObject(ret);
    }
    /**
    * Start a TableDB write transaction.
    * The transaction object must be committed or rolled back before dropping.
    * @returns {Promise<VeilidTableDBTransaction>}
    */
    createTransaction() {
        const ret = wasm.veilidtabledb_createTransaction(this.__wbg_ptr);
        return takeObject(ret);
    }
}

const VeilidTableDBTransactionFinalization = new FinalizationRegistry(ptr => wasm.__wbg_veilidtabledbtransaction_free(ptr >>> 0));
/**
*/
export class VeilidTableDBTransaction {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(VeilidTableDBTransaction.prototype);
        obj.__wbg_ptr = ptr;
        VeilidTableDBTransactionFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        VeilidTableDBTransactionFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_veilidtabledbtransaction_free(ptr);
    }
    /**
    * Don't use this constructor directly.
    * Use `.createTransaction()` on an instance of `VeilidTableDB` instead.
    * @deprecated
    */
    constructor() {
        const ret = wasm.veilidtabledbtransaction_new();
        this.__wbg_ptr = ret >>> 0;
        return this;
    }
    /**
    * Commit the transaction. Performs all actions atomically.
    * @returns {Promise<void>}
    */
    commit() {
        const ret = wasm.veilidtabledbtransaction_commit(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * Rollback the transaction. Does nothing to the TableDB.
    */
    rollback() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.veilidtabledbtransaction_rollback(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Store a key with a value in a column in the TableDB.
    * Does not modify TableDB until `.commit()` is called.
    * @param {number} col
    * @param {Uint8Array} key
    * @param {Uint8Array} value
    */
    store(col, key, value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(key, wasm.__wbindgen_malloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passArray8ToWasm0(value, wasm.__wbindgen_malloc);
            const len1 = WASM_VECTOR_LEN;
            wasm.veilidtabledbtransaction_store(retptr, this.__wbg_ptr, col, ptr0, len0, ptr1, len1);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Delete key with from a column in the TableDB
    * @param {number} col
    * @param {Uint8Array} key
    */
    deleteKey(col, key) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(key, wasm.__wbindgen_malloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.veilidtabledbtransaction_deleteKey(retptr, this.__wbg_ptr, col, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}

const veilidClientFinalization = new FinalizationRegistry(ptr => wasm.__wbg_veilidclient_free(ptr >>> 0));
/**
*/
export class veilidClient {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        veilidClientFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_veilidclient_free(ptr);
    }
    /**
    * @param {VeilidWASMConfig} platformConfig
    * @returns {Promise<void>}
    */
    static initializeCore(platformConfig) {
        const ret = wasm.veilidclient_initializeCore(addHeapObject(platformConfig));
        return takeObject(ret);
    }
    /**
    * Initialize a Veilid node, with the configuration in JSON format
    *
    * Must be called only once at the start of an application
    *
    * @param {UpdateVeilidFunction} update_callback_js - called when internal state of the Veilid node changes, for example, when app-level messages are received, when private routes die and need to be reallocated, or when routing table states change
    * @param {string} json_config - called at startup to supply a JSON configuration object.
    * @param {UpdateVeilidFunction} update_callback_js
    * @param {string} json_config
    * @returns {Promise<void>}
    */
    static startupCore(update_callback_js, json_config) {
        const ptr0 = passStringToWasm0(json_config, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.veilidclient_startupCore(addHeapObject(update_callback_js), ptr0, len0);
        return takeObject(ret);
    }
    /**
    * @param {string} layer
    * @param {VeilidConfigLogLevel} log_level
    */
    static changeLogLevel(layer, log_level) {
        const ptr0 = passStringToWasm0(layer, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.veilidclient_changeLogLevel(ptr0, len0, addHeapObject(log_level));
    }
    /**
    * Shut down Veilid and terminate the API.
    * @returns {Promise<void>}
    */
    static shutdownCore() {
        const ret = wasm.veilidclient_shutdownCore();
        return takeObject(ret);
    }
    /**
    * Get a full copy of the current state of Veilid.
    * @returns {Promise<VeilidState>}
    */
    static getState() {
        const ret = wasm.veilidclient_getState();
        return takeObject(ret);
    }
    /**
    * Connect to the network.
    * @returns {Promise<void>}
    */
    static attach() {
        const ret = wasm.veilidclient_attach();
        return takeObject(ret);
    }
    /**
    * Disconnect from the network.
    * @returns {Promise<void>}
    */
    static detach() {
        const ret = wasm.veilidclient_detach();
        return takeObject(ret);
    }
    /**
    * Execute an 'internal debug command'.
    * @param {string} command
    * @returns {Promise<string>}
    */
    static debug(command) {
        const ptr0 = passStringToWasm0(command, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.veilidclient_debug(ptr0, len0);
        return takeObject(ret);
    }
    /**
    * Return the cargo package version of veilid-core, in object format.
    * @returns {VeilidVersion}
    */
    static version() {
        const ret = wasm.veilidclient_version();
        return takeObject(ret);
    }
    /**
    * Return the cargo package version of veilid-core, in string format.
    * @returns {string}
    */
    static versionString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.veilidclient_versionString(retptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const veilidCryptoFinalization = new FinalizationRegistry(ptr => wasm.__wbg_veilidcrypto_free(ptr >>> 0));
/**
*/
export class veilidCrypto {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        veilidCryptoFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_veilidcrypto_free(ptr);
    }
    /**
    * @returns {string[]}
    */
    static validCryptoKinds() {
        const ret = wasm.veilidcrypto_validCryptoKinds();
        return takeObject(ret);
    }
    /**
    * @returns {string}
    */
    static bestCryptoKind() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.veilidcrypto_bestCryptoKind(retptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * @param {string} kind
    * @param {string} key
    * @param {string} secret
    * @returns {string}
    */
    static cachedDh(kind, key, secret) {
        let deferred5_0;
        let deferred5_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(kind, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passStringToWasm0(secret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len2 = WASM_VECTOR_LEN;
            wasm.veilidcrypto_cachedDh(retptr, ptr0, len0, ptr1, len1, ptr2, len2);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            var ptr4 = r0;
            var len4 = r1;
            if (r3) {
                ptr4 = 0; len4 = 0;
                throw takeObject(r2);
            }
            deferred5_0 = ptr4;
            deferred5_1 = len4;
            return getStringFromWasm0(ptr4, len4);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred5_0, deferred5_1, 1);
        }
    }
    /**
    * @param {string} kind
    * @param {string} key
    * @param {string} secret
    * @returns {string}
    */
    static computeDh(kind, key, secret) {
        let deferred5_0;
        let deferred5_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(kind, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passStringToWasm0(secret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len2 = WASM_VECTOR_LEN;
            wasm.veilidcrypto_computeDh(retptr, ptr0, len0, ptr1, len1, ptr2, len2);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            var ptr4 = r0;
            var len4 = r1;
            if (r3) {
                ptr4 = 0; len4 = 0;
                throw takeObject(r2);
            }
            deferred5_0 = ptr4;
            deferred5_1 = len4;
            return getStringFromWasm0(ptr4, len4);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred5_0, deferred5_1, 1);
        }
    }
    /**
    * @param {string} kind
    * @param {number} len
    * @returns {Uint8Array}
    */
    static randomBytes(kind, len) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(kind, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.veilidcrypto_randomBytes(retptr, ptr0, len0, len);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            var v2 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1, 1);
            return v2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {string} kind
    * @returns {number}
    */
    static defaultSaltLength(kind) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(kind, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.veilidcrypto_defaultSaltLength(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return r0 >>> 0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {string} kind
    * @param {Uint8Array} password
    * @param {Uint8Array} salt
    * @returns {string}
    */
    static hashPassword(kind, password, salt) {
        let deferred5_0;
        let deferred5_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(kind, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passArray8ToWasm0(password, wasm.__wbindgen_malloc);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passArray8ToWasm0(salt, wasm.__wbindgen_malloc);
            const len2 = WASM_VECTOR_LEN;
            wasm.veilidcrypto_hashPassword(retptr, ptr0, len0, ptr1, len1, ptr2, len2);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            var ptr4 = r0;
            var len4 = r1;
            if (r3) {
                ptr4 = 0; len4 = 0;
                throw takeObject(r2);
            }
            deferred5_0 = ptr4;
            deferred5_1 = len4;
            return getStringFromWasm0(ptr4, len4);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred5_0, deferred5_1, 1);
        }
    }
    /**
    * @param {string} kind
    * @param {Uint8Array} password
    * @param {string} password_hash
    * @returns {boolean}
    */
    static verifyPassword(kind, password, password_hash) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(kind, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passArray8ToWasm0(password, wasm.__wbindgen_malloc);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passStringToWasm0(password_hash, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len2 = WASM_VECTOR_LEN;
            wasm.veilidcrypto_verifyPassword(retptr, ptr0, len0, ptr1, len1, ptr2, len2);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return r0 !== 0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {string} kind
    * @param {Uint8Array} password
    * @param {Uint8Array} salt
    * @returns {string}
    */
    static deriveSharedSecret(kind, password, salt) {
        let deferred5_0;
        let deferred5_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(kind, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passArray8ToWasm0(password, wasm.__wbindgen_malloc);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passArray8ToWasm0(salt, wasm.__wbindgen_malloc);
            const len2 = WASM_VECTOR_LEN;
            wasm.veilidcrypto_deriveSharedSecret(retptr, ptr0, len0, ptr1, len1, ptr2, len2);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            var ptr4 = r0;
            var len4 = r1;
            if (r3) {
                ptr4 = 0; len4 = 0;
                throw takeObject(r2);
            }
            deferred5_0 = ptr4;
            deferred5_1 = len4;
            return getStringFromWasm0(ptr4, len4);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred5_0, deferred5_1, 1);
        }
    }
    /**
    * @param {string} kind
    * @returns {string}
    */
    static randomNonce(kind) {
        let deferred3_0;
        let deferred3_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(kind, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.veilidcrypto_randomNonce(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            var ptr2 = r0;
            var len2 = r1;
            if (r3) {
                ptr2 = 0; len2 = 0;
                throw takeObject(r2);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
    * @param {string} kind
    * @returns {string}
    */
    static randomSharedSecret(kind) {
        let deferred3_0;
        let deferred3_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(kind, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.veilidcrypto_randomSharedSecret(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            var ptr2 = r0;
            var len2 = r1;
            if (r3) {
                ptr2 = 0; len2 = 0;
                throw takeObject(r2);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
    * @param {string[]} node_ids
    * @param {Uint8Array} data
    * @param {string[]} signatures
    * @returns {string[]}
    */
    static verifySignatures(node_ids, data, signatures) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.veilidcrypto_verifySignatures(retptr, addHeapObject(node_ids), ptr0, len0, addHeapObject(signatures));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Uint8Array} data
    * @param {string[]} key_pairs
    * @returns {string[]}
    */
    static generateSignatures(data, key_pairs) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.veilidcrypto_generateSignatures(retptr, ptr0, len0, addHeapObject(key_pairs));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {string} kind
    * @returns {string}
    */
    static generateKeyPair(kind) {
        let deferred3_0;
        let deferred3_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(kind, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.veilidcrypto_generateKeyPair(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            var ptr2 = r0;
            var len2 = r1;
            if (r3) {
                ptr2 = 0; len2 = 0;
                throw takeObject(r2);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
    * @param {string} kind
    * @param {Uint8Array} data
    * @returns {string}
    */
    static generateHash(kind, data) {
        let deferred4_0;
        let deferred4_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(kind, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
            const len1 = WASM_VECTOR_LEN;
            wasm.veilidcrypto_generateHash(retptr, ptr0, len0, ptr1, len1);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            var ptr3 = r0;
            var len3 = r1;
            if (r3) {
                ptr3 = 0; len3 = 0;
                throw takeObject(r2);
            }
            deferred4_0 = ptr3;
            deferred4_1 = len3;
            return getStringFromWasm0(ptr3, len3);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
        }
    }
    /**
    * @param {string} kind
    * @param {string} key
    * @param {string} secret
    * @returns {boolean}
    */
    static validateKeyPair(kind, key, secret) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(kind, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passStringToWasm0(secret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len2 = WASM_VECTOR_LEN;
            wasm.veilidcrypto_validateKeyPair(retptr, ptr0, len0, ptr1, len1, ptr2, len2);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return r0 !== 0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {string} kind
    * @param {Uint8Array} data
    * @param {string} hash
    * @returns {boolean}
    */
    static validateHash(kind, data, hash) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(kind, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passStringToWasm0(hash, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len2 = WASM_VECTOR_LEN;
            wasm.veilidcrypto_validateHash(retptr, ptr0, len0, ptr1, len1, ptr2, len2);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return r0 !== 0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {string} kind
    * @param {string} key1
    * @param {string} key2
    * @returns {string}
    */
    static distance(kind, key1, key2) {
        let deferred5_0;
        let deferred5_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(kind, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(key1, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passStringToWasm0(key2, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len2 = WASM_VECTOR_LEN;
            wasm.veilidcrypto_distance(retptr, ptr0, len0, ptr1, len1, ptr2, len2);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            var ptr4 = r0;
            var len4 = r1;
            if (r3) {
                ptr4 = 0; len4 = 0;
                throw takeObject(r2);
            }
            deferred5_0 = ptr4;
            deferred5_1 = len4;
            return getStringFromWasm0(ptr4, len4);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred5_0, deferred5_1, 1);
        }
    }
    /**
    * @param {string} kind
    * @param {string} key
    * @param {string} secret
    * @param {Uint8Array} data
    * @returns {string}
    */
    static sign(kind, key, secret, data) {
        let deferred6_0;
        let deferred6_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(kind, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passStringToWasm0(secret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len2 = WASM_VECTOR_LEN;
            const ptr3 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
            const len3 = WASM_VECTOR_LEN;
            wasm.veilidcrypto_sign(retptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            var ptr5 = r0;
            var len5 = r1;
            if (r3) {
                ptr5 = 0; len5 = 0;
                throw takeObject(r2);
            }
            deferred6_0 = ptr5;
            deferred6_1 = len5;
            return getStringFromWasm0(ptr5, len5);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred6_0, deferred6_1, 1);
        }
    }
    /**
    * @param {string} kind
    * @param {string} key
    * @param {Uint8Array} data
    * @param {string} signature
    */
    static verify(kind, key, data, signature) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(kind, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
            const len2 = WASM_VECTOR_LEN;
            const ptr3 = passStringToWasm0(signature, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len3 = WASM_VECTOR_LEN;
            wasm.veilidcrypto_verify(retptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {string} kind
    * @returns {number}
    */
    static aeadOverhead(kind) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(kind, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.veilidcrypto_aeadOverhead(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return r0 >>> 0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {string} kind
    * @param {Uint8Array} body
    * @param {string} nonce
    * @param {string} shared_secret
    * @param {Uint8Array | undefined} [associated_data]
    * @returns {Uint8Array}
    */
    static decryptAead(kind, body, nonce, shared_secret, associated_data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(kind, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passArray8ToWasm0(body, wasm.__wbindgen_malloc);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passStringToWasm0(nonce, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len2 = WASM_VECTOR_LEN;
            const ptr3 = passStringToWasm0(shared_secret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len3 = WASM_VECTOR_LEN;
            var ptr4 = isLikeNone(associated_data) ? 0 : passArray8ToWasm0(associated_data, wasm.__wbindgen_malloc);
            var len4 = WASM_VECTOR_LEN;
            wasm.veilidcrypto_decryptAead(retptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            var v6 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1, 1);
            return v6;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {string} kind
    * @param {Uint8Array} body
    * @param {string} nonce
    * @param {string} shared_secret
    * @param {Uint8Array | undefined} [associated_data]
    * @returns {Uint8Array}
    */
    static encryptAead(kind, body, nonce, shared_secret, associated_data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(kind, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passArray8ToWasm0(body, wasm.__wbindgen_malloc);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passStringToWasm0(nonce, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len2 = WASM_VECTOR_LEN;
            const ptr3 = passStringToWasm0(shared_secret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len3 = WASM_VECTOR_LEN;
            var ptr4 = isLikeNone(associated_data) ? 0 : passArray8ToWasm0(associated_data, wasm.__wbindgen_malloc);
            var len4 = WASM_VECTOR_LEN;
            wasm.veilidcrypto_encryptAead(retptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            var v6 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1, 1);
            return v6;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {string} kind
    * @param {Uint8Array} body
    * @param {string} nonce
    * @param {string} shared_secret
    * @returns {Uint8Array}
    */
    static cryptNoAuth(kind, body, nonce, shared_secret) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(kind, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passArray8ToWasm0(body, wasm.__wbindgen_malloc);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passStringToWasm0(nonce, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len2 = WASM_VECTOR_LEN;
            const ptr3 = passStringToWasm0(shared_secret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len3 = WASM_VECTOR_LEN;
            wasm.veilidcrypto_cryptNoAuth(retptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            var v5 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1, 1);
            return v5;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Length of a crypto key in bytes
    * @returns {number}
    */
    static get CRYPTO_KEY_LENGTH() {
        const ret = wasm.veilidcrypto_CRYPTO_KEY_LENGTH();
        return ret >>> 0;
    }
    /**
    * Length of a crypto key in bytes after encoding to base64url
    * @returns {number}
    */
    static get CRYPTO_KEY_LENGTH_ENCODED() {
        const ret = wasm.veilidcrypto_CRYPTO_KEY_LENGTH_ENCODED();
        return ret >>> 0;
    }
    /**
    * Length of a hash digest in bytes
    * @returns {number}
    */
    static get HASH_DIGEST_LENGTH() {
        const ret = wasm.veilidcrypto_CRYPTO_KEY_LENGTH();
        return ret >>> 0;
    }
    /**
    * Length of a hash digest in bytes after encoding to base64url
    * @returns {number}
    */
    static get HASH_DIGEST_LENGTH_ENCODED() {
        const ret = wasm.veilidcrypto_CRYPTO_KEY_LENGTH_ENCODED();
        return ret >>> 0;
    }
    /**
    * Length of a nonce in bytes
    * @returns {number}
    */
    static get NONCE_LENGTH() {
        const ret = wasm.veilidcrypto_NONCE_LENGTH();
        return ret >>> 0;
    }
    /**
    * Length of a nonce in bytes after encoding to base64url
    * @returns {number}
    */
    static get NONCE_LENGTH_ENCODED() {
        const ret = wasm.veilidcrypto_CRYPTO_KEY_LENGTH();
        return ret >>> 0;
    }
    /**
    * Length of a crypto key in bytes
    * @returns {number}
    */
    static get PUBLIC_KEY_LENGTH() {
        const ret = wasm.veilidcrypto_CRYPTO_KEY_LENGTH();
        return ret >>> 0;
    }
    /**
    * Length of a crypto key in bytes after encoding to base64url
    * @returns {number}
    */
    static get PUBLIC_KEY_LENGTH_ENCODED() {
        const ret = wasm.veilidcrypto_CRYPTO_KEY_LENGTH_ENCODED();
        return ret >>> 0;
    }
    /**
    * Length of a route id in bytes
    * @returns {number}
    */
    static get ROUTE_ID_LENGTH() {
        const ret = wasm.veilidcrypto_CRYPTO_KEY_LENGTH();
        return ret >>> 0;
    }
    /**
    * Length of a route id in bytes after encoding to base64url
    * @returns {number}
    */
    static get ROUTE_ID_LENGTH_ENCODED() {
        const ret = wasm.veilidcrypto_CRYPTO_KEY_LENGTH_ENCODED();
        return ret >>> 0;
    }
    /**
    * Length of a secret key in bytes
    * @returns {number}
    */
    static get SECRET_KEY_LENGTH() {
        const ret = wasm.veilidcrypto_CRYPTO_KEY_LENGTH();
        return ret >>> 0;
    }
    /**
    * Length of a secret key in bytes after encoding to base64url
    * @returns {number}
    */
    static get SECRET_KEY_LENGTH_ENCODED() {
        const ret = wasm.veilidcrypto_CRYPTO_KEY_LENGTH_ENCODED();
        return ret >>> 0;
    }
    /**
    * Length of a shared secret in bytes
    * @returns {number}
    */
    static get SHARED_SECRET_LENGTH() {
        const ret = wasm.veilidcrypto_CRYPTO_KEY_LENGTH();
        return ret >>> 0;
    }
    /**
    * Length of a shared secret in bytes after encoding to base64url
    * @returns {number}
    */
    static get SHARED_SECRET_LENGTH_ENCODED() {
        const ret = wasm.veilidcrypto_CRYPTO_KEY_LENGTH_ENCODED();
        return ret >>> 0;
    }
    /**
    * Length of a signature in bytes
    * @returns {number}
    */
    static get SIGNATURE_LENGTH() {
        const ret = wasm.veilidcrypto_SIGNATURE_LENGTH();
        return ret >>> 0;
    }
    /**
    * Length of a signature in bytes after encoding to base64url
    * @returns {number}
    */
    static get SIGNATURE_LENGTH_ENCODED() {
        const ret = wasm.veilidcrypto_SIGNATURE_LENGTH_ENCODED();
        return ret >>> 0;
    }
}

export function __wbindgen_object_drop_ref(arg0) {
    takeObject(arg0);
};

export function __wbindgen_object_clone_ref(arg0) {
    const ret = getObject(arg0);
    return addHeapObject(ret);
};

export function __wbindgen_error_new(arg0, arg1) {
    const ret = new Error(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbindgen_number_new(arg0) {
    const ret = arg0;
    return addHeapObject(ret);
};

export function __wbindgen_string_new(arg0, arg1) {
    const ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
};

export function __wbg_veilidtabledbtransaction_new(arg0) {
    const ret = VeilidTableDBTransaction.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbindgen_is_undefined(arg0) {
    const ret = getObject(arg0) === undefined;
    return ret;
};

export function __wbindgen_in(arg0, arg1) {
    const ret = getObject(arg0) in getObject(arg1);
    return ret;
};

export function __wbindgen_boolean_get(arg0) {
    const v = getObject(arg0);
    const ret = typeof(v) === 'boolean' ? (v ? 1 : 0) : 2;
    return ret;
};

export function __wbindgen_is_bigint(arg0) {
    const ret = typeof(getObject(arg0)) === 'bigint';
    return ret;
};

export function __wbindgen_number_get(arg0, arg1) {
    const obj = getObject(arg1);
    const ret = typeof(obj) === 'number' ? obj : undefined;
    getFloat64Memory0()[arg0 / 8 + 1] = isLikeNone(ret) ? 0 : ret;
    getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
};

export function __wbindgen_bigint_from_i64(arg0) {
    const ret = arg0;
    return addHeapObject(ret);
};

export function __wbindgen_jsval_eq(arg0, arg1) {
    const ret = getObject(arg0) === getObject(arg1);
    return ret;
};

export function __wbindgen_string_get(arg0, arg1) {
    const obj = getObject(arg1);
    const ret = typeof(obj) === 'string' ? obj : undefined;
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
};

export function __wbindgen_is_object(arg0) {
    const val = getObject(arg0);
    const ret = typeof(val) === 'object' && val !== null;
    return ret;
};

export function __wbindgen_bigint_from_u64(arg0) {
    const ret = BigInt.asUintN(64, arg0);
    return addHeapObject(ret);
};

export function __wbindgen_is_string(arg0) {
    const ret = typeof(getObject(arg0)) === 'string';
    return ret;
};

export function __wbg_new_abda76e883ba8a5f() {
    const ret = new Error();
    return addHeapObject(ret);
};

export function __wbg_stack_658279fe44541cf6(arg0, arg1) {
    const ret = getObject(arg1).stack;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
};

export function __wbg_error_f851667af71bcfc6(arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        console.error(getStringFromWasm0(arg0, arg1));
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
};

export function __wbindgen_cb_drop(arg0) {
    const obj = takeObject(arg0).original;
    if (obj.cnt-- == 1) {
        obj.a = 0;
        return true;
    }
    const ret = false;
    return ret;
};

export function __wbindgen_jsval_loose_eq(arg0, arg1) {
    const ret = getObject(arg0) == getObject(arg1);
    return ret;
};

export function __wbg_set_8761474ad72b9bf1(arg0, arg1, arg2) {
    getObject(arg0)[takeObject(arg1)] = takeObject(arg2);
};

export function __wbg_log_940082fdbd2bdbbc(arg0, arg1) {
    console.log(getStringFromWasm0(arg0, arg1));
};

export function __wbg_clearTimeout_76877dbc010e786d(arg0) {
    const ret = clearTimeout(takeObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_setTimeout_75cb9b6991a4031d() { return handleError(function (arg0, arg1) {
    const ret = setTimeout(getObject(arg0), arg1);
    return addHeapObject(ret);
}, arguments) };

export function __wbindgen_is_null(arg0) {
    const ret = getObject(arg0) === null;
    return ret;
};

export function __wbg_queueMicrotask_2be8b97a81fe4d00(arg0) {
    const ret = getObject(arg0).queueMicrotask;
    return addHeapObject(ret);
};

export function __wbindgen_is_function(arg0) {
    const ret = typeof(getObject(arg0)) === 'function';
    return ret;
};

export function __wbg_queueMicrotask_e5949c35d772a669(arg0) {
    queueMicrotask(getObject(arg0));
};

export function __wbg_crypto_c48a774b022d20ac(arg0) {
    const ret = getObject(arg0).crypto;
    return addHeapObject(ret);
};

export function __wbg_process_298734cf255a885d(arg0) {
    const ret = getObject(arg0).process;
    return addHeapObject(ret);
};

export function __wbg_versions_e2e78e134e3e5d01(arg0) {
    const ret = getObject(arg0).versions;
    return addHeapObject(ret);
};

export function __wbg_node_1cd7a5d853dbea79(arg0) {
    const ret = getObject(arg0).node;
    return addHeapObject(ret);
};

export function __wbg_require_8f08ceecec0f4fee() { return handleError(function () {
    const ret = module.require;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_msCrypto_bcb970640f50a1e8(arg0) {
    const ret = getObject(arg0).msCrypto;
    return addHeapObject(ret);
};

export function __wbg_randomFillSync_dc1e9a60c158336d() { return handleError(function (arg0, arg1) {
    getObject(arg0).randomFillSync(takeObject(arg1));
}, arguments) };

export function __wbg_getRandomValues_37fa2ca9e4e07fab() { return handleError(function (arg0, arg1) {
    getObject(arg0).getRandomValues(getObject(arg1));
}, arguments) };

export function __wbg_String_88810dfeb4021902(arg0, arg1) {
    const ret = String(getObject(arg1));
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
};

export function __wbg_getwithrefkey_5e6d9547403deab8(arg0, arg1) {
    const ret = getObject(arg0)[getObject(arg1)];
    return addHeapObject(ret);
};

export function __wbg_set_841ac57cff3d672b(arg0, arg1, arg2) {
    getObject(arg0)[takeObject(arg1)] = takeObject(arg2);
};

export function __wbg_log_c9486ca5d8e2cbe8(arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        console.log(getStringFromWasm0(arg0, arg1));
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
};

export function __wbg_log_aba5996d9bde071f(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        console.log(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3), getStringFromWasm0(arg4, arg5), getStringFromWasm0(arg6, arg7));
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
};

export function __wbg_mark_40e050a77cc39fea(arg0, arg1) {
    performance.mark(getStringFromWasm0(arg0, arg1));
};

export function __wbg_measure_aa7a73f17813f708() { return handleError(function (arg0, arg1, arg2, arg3) {
    let deferred0_0;
    let deferred0_1;
    let deferred1_0;
    let deferred1_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        deferred1_0 = arg2;
        deferred1_1 = arg3;
        performance.measure(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}, arguments) };

export function __wbg_instanceof_Window_cde2416cf5126a72(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof Window;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_localStorage_e11f72e996a4f5d9() { return handleError(function (arg0) {
    const ret = getObject(arg0).localStorage;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
}, arguments) };

export function __wbg_indexedDB_978e65753069c498() { return handleError(function (arg0) {
    const ret = getObject(arg0).indexedDB;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
}, arguments) };

export function __wbg_instanceof_Blob_bd674d851f2d730d(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof Blob;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_key_05b294ba6de250c8() { return handleError(function (arg0) {
    const ret = getObject(arg0).key;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_continue_6cf313be16a4a872() { return handleError(function (arg0) {
    getObject(arg0).continue();
}, arguments) };

export function __wbg_instanceof_IdbRequest_21cd2c9106469858(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof IDBRequest;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_result_7196a76180ba0d87() { return handleError(function (arg0) {
    const ret = getObject(arg0).result;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_setonsuccess_24399c655e56d454(arg0, arg1) {
    getObject(arg0).onsuccess = getObject(arg1);
};

export function __wbg_setonerror_d9ee9dcf19767629(arg0, arg1) {
    getObject(arg0).onerror = getObject(arg1);
};

export function __wbg_setoncomplete_50a5ce9fac140535(arg0, arg1) {
    getObject(arg0).oncomplete = getObject(arg1);
};

export function __wbg_setonerror_0231fde478f6b2b2(arg0, arg1) {
    getObject(arg0).onerror = getObject(arg1);
};

export function __wbg_objectStore_84121dafd15ea284() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).objectStore(getStringFromWasm0(arg1, arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_code_b04769e6323fa963(arg0) {
    const ret = getObject(arg0).code;
    return ret;
};

export function __wbg_length_b228e732960bf09f(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};

export function __wbg_data_624fd2b6a4a5ac9e(arg0) {
    const ret = getObject(arg0).data;
    return addHeapObject(ret);
};

export function __wbg_wasClean_f80e269a7035a33a(arg0) {
    const ret = getObject(arg0).wasClean;
    return ret;
};

export function __wbg_code_8a4e6c814f55b956(arg0) {
    const ret = getObject(arg0).code;
    return ret;
};

export function __wbg_reason_38737e2df79b7571(arg0, arg1) {
    const ret = getObject(arg1).reason;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
};

export function __wbg_type_035d2025d17aefc7(arg0, arg1) {
    const ret = getObject(arg1).type;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
};

export function __wbg_target_6efb4504c149139f(arg0) {
    const ret = getObject(arg0).target;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_delete_01dd21e8b0c79883() { return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).delete(getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_openCursor_e8b991ba67d38034() { return handleError(function (arg0) {
    const ret = getObject(arg0).openCursor();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_openCursor_05316787760c9eea() { return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).openCursor(getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_put_f93b43c5e246b00e() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).put(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_getItem_c81cd3ae30cd579a() { return handleError(function (arg0, arg1, arg2, arg3) {
    const ret = getObject(arg1).getItem(getStringFromWasm0(arg2, arg3));
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
}, arguments) };

export function __wbg_setItem_fe04f524052a3839() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).setItem(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
}, arguments) };

export function __wbg_delete_8390fe6d4b04b86c() { return handleError(function (arg0, arg1, arg2) {
    delete getObject(arg0)[getStringFromWasm0(arg1, arg2)];
}, arguments) };

export function __wbg_instanceof_IdbCursorWithValue_20ec15802ae6d2a0(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof IDBCursorWithValue;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_value_5a4429fda77716af() { return handleError(function (arg0) {
    const ret = getObject(arg0).value;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_bound_f0496c8e72a7b7cc() { return handleError(function (arg0, arg1, arg2, arg3) {
    const ret = IDBKeyRange.bound(getObject(arg0), getObject(arg1), arg2 !== 0, arg3 !== 0);
    return addHeapObject(ret);
}, arguments) };

export function __wbg_lowerBound_5d3fe3333cf700f7() { return handleError(function (arg0) {
    const ret = IDBKeyRange.lowerBound(getObject(arg0));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_instanceof_IdbDatabase_244beb2322860698(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof IDBDatabase;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_version_75b603156bba90ab(arg0) {
    const ret = getObject(arg0).version;
    return ret;
};

export function __wbg_objectStoreNames_91e7ba9d286ee70d(arg0) {
    const ret = getObject(arg0).objectStoreNames;
    return addHeapObject(ret);
};

export function __wbg_close_8721a441c465ae56(arg0) {
    getObject(arg0).close();
};

export function __wbg_createObjectStore_7e6b16611b81ad75() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).createObjectStore(getStringFromWasm0(arg1, arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_transaction_cf4da3e02e29fb77() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).transaction(getStringFromWasm0(arg1, arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_transaction_ba2cc1930cb9bc8c() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).transaction(getObject(arg1), takeObject(arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_deleteDatabase_c9a73536ad4de9db() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).deleteDatabase(getStringFromWasm0(arg1, arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_open_5c1f0b394e81527c() { return handleError(function (arg0, arg1, arg2, arg3) {
    const ret = getObject(arg0).open(getStringFromWasm0(arg1, arg2), arg3 >>> 0);
    return addHeapObject(ret);
}, arguments) };

export function __wbg_open_76cacc0a1983a919() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).open(getStringFromWasm0(arg1, arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_setonupgradeneeded_16037a49fd0ba457(arg0, arg1) {
    getObject(arg0).onupgradeneeded = getObject(arg1);
};

export function __wbg_url_f407611c9c7e617c(arg0, arg1) {
    const ret = getObject(arg1).url;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
};

export function __wbg_readyState_13e55da5ad6d64e2(arg0) {
    const ret = getObject(arg0).readyState;
    return ret;
};

export function __wbg_setonopen_b2a170d59c1abe88(arg0, arg1) {
    getObject(arg0).onopen = getObject(arg1);
};

export function __wbg_setonerror_e72476002c2f519a(arg0, arg1) {
    getObject(arg0).onerror = getObject(arg1);
};

export function __wbg_setonclose_4527668a5c065333(arg0, arg1) {
    getObject(arg0).onclose = getObject(arg1);
};

export function __wbg_setonmessage_eb44f51ef6e7e0e8(arg0, arg1) {
    getObject(arg0).onmessage = getObject(arg1);
};

export function __wbg_setbinaryType_dcb62e0f2b346301(arg0, arg1) {
    getObject(arg0).binaryType = takeObject(arg1);
};

export function __wbg_new_b9b318679315404f() { return handleError(function (arg0, arg1) {
    const ret = new WebSocket(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_newwithstrsequence_cb0c70242507d0e7() { return handleError(function (arg0, arg1, arg2) {
    const ret = new WebSocket(getStringFromWasm0(arg0, arg1), getObject(arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_close_f4135085ec3fc8f0() { return handleError(function (arg0) {
    getObject(arg0).close();
}, arguments) };

export function __wbg_send_c1cc1284964b7434() { return handleError(function (arg0, arg1, arg2) {
    getObject(arg0).send(getStringFromWasm0(arg1, arg2));
}, arguments) };

export function __wbg_send_2860805104507701() { return handleError(function (arg0, arg1, arg2) {
    getObject(arg0).send(getArrayU8FromWasm0(arg1, arg2));
}, arguments) };

export function __wbg_get_4a9aa5157afeb382(arg0, arg1) {
    const ret = getObject(arg0)[arg1 >>> 0];
    return addHeapObject(ret);
};

export function __wbg_length_cace2e0b3ddc0502(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};

export function __wbg_new_08236689f0afb357() {
    const ret = new Array();
    return addHeapObject(ret);
};

export function __wbg_newnoargs_ccdcae30fd002262(arg0, arg1) {
    const ret = new Function(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_next_15da6a3df9290720(arg0) {
    const ret = getObject(arg0).next;
    return addHeapObject(ret);
};

export function __wbg_next_1989a20442400aaa() { return handleError(function (arg0) {
    const ret = getObject(arg0).next();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_done_bc26bf4ada718266(arg0) {
    const ret = getObject(arg0).done;
    return ret;
};

export function __wbg_value_0570714ff7d75f35(arg0) {
    const ret = getObject(arg0).value;
    return addHeapObject(ret);
};

export function __wbg_iterator_7ee1a391d310f8e4() {
    const ret = Symbol.iterator;
    return addHeapObject(ret);
};

export function __wbg_get_2aff440840bb6202() { return handleError(function (arg0, arg1) {
    const ret = Reflect.get(getObject(arg0), getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_call_669127b9d730c650() { return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).call(getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_new_c728d68b8b34487e() {
    const ret = new Object();
    return addHeapObject(ret);
};

export function __wbg_self_3fad056edded10bd() { return handleError(function () {
    const ret = self.self;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_window_a4f46c98a61d4089() { return handleError(function () {
    const ret = window.window;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_globalThis_17eff828815f7d84() { return handleError(function () {
    const ret = globalThis.globalThis;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_global_46f939f6541643c5() { return handleError(function () {
    const ret = global.global;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_eval_78699ae6b5ab4a6d() { return handleError(function (arg0, arg1) {
    const ret = eval(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_set_0ac78a2bc07da03c(arg0, arg1, arg2) {
    getObject(arg0)[arg1 >>> 0] = takeObject(arg2);
};

export function __wbg_from_ba72c50feaf1d8c0(arg0) {
    const ret = Array.from(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_isArray_38525be7442aa21e(arg0) {
    const ret = Array.isArray(getObject(arg0));
    return ret;
};

export function __wbg_push_fd3233d09cf81821(arg0, arg1) {
    const ret = getObject(arg0).push(getObject(arg1));
    return ret;
};

export function __wbg_instanceof_ArrayBuffer_c7cc317e5c29cc0d(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof ArrayBuffer;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_call_53fc3abd42e24ec8() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_isSafeInteger_c38b0a16d0c7cef7(arg0) {
    const ret = Number.isSafeInteger(getObject(arg0));
    return ret;
};

export function __wbg_now_4579335d3581594c() {
    const ret = Date.now();
    return ret;
};

export function __wbg_entries_6d727b73ee02b7ce(arg0) {
    const ret = Object.entries(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_new_feb65b865d980ae2(arg0, arg1) {
    try {
        var state0 = {a: arg0, b: arg1};
        var cb0 = (arg0, arg1) => {
            const a = state0.a;
            state0.a = 0;
            try {
                return __wbg_adapter_422(a, state0.b, arg0, arg1);
            } finally {
                state0.a = a;
            }
        };
        const ret = new Promise(cb0);
        return addHeapObject(ret);
    } finally {
        state0.a = state0.b = 0;
    }
};

export function __wbg_resolve_a3252b2860f0a09e(arg0) {
    const ret = Promise.resolve(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_then_89e1c559530b85cf(arg0, arg1) {
    const ret = getObject(arg0).then(getObject(arg1));
    return addHeapObject(ret);
};

export function __wbg_buffer_344d9b41efe96da7(arg0) {
    const ret = getObject(arg0).buffer;
    return addHeapObject(ret);
};

export function __wbg_newwithbyteoffsetandlength_2dc04d99088b15e3(arg0, arg1, arg2) {
    const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_new_d8a000788389a31e(arg0) {
    const ret = new Uint8Array(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_set_dcfd613a3420f908(arg0, arg1, arg2) {
    getObject(arg0).set(getObject(arg1), arg2 >>> 0);
};

export function __wbg_length_a5587d6cd79ab197(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};

export function __wbg_instanceof_Uint8Array_19e6f142a5e7e1e1(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof Uint8Array;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_newwithlength_13b5319ab422dcf6(arg0) {
    const ret = new Uint8Array(arg0 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_subarray_6ca5cfa7fbb9abbe(arg0, arg1, arg2) {
    const ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_parse_3f0cb48976ca4123() { return handleError(function (arg0, arg1) {
    const ret = JSON.parse(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_has_cdf8b85f6e903c80() { return handleError(function (arg0, arg1) {
    const ret = Reflect.has(getObject(arg0), getObject(arg1));
    return ret;
}, arguments) };

export function __wbindgen_bigint_get_as_i64(arg0, arg1) {
    const v = getObject(arg1);
    const ret = typeof(v) === 'bigint' ? v : undefined;
    getBigInt64Memory0()[arg0 / 8 + 1] = isLikeNone(ret) ? BigInt(0) : ret;
    getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
};

export function __wbindgen_debug_string(arg0, arg1) {
    const ret = debugString(getObject(arg1));
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
};

export function __wbindgen_throw(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

export function __wbindgen_memory() {
    const ret = wasm.memory;
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper7167(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 1308, __wbg_adapter_50);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper10956(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 2100, __wbg_adapter_53);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper11100(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 2141, __wbg_adapter_56);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper11101(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 2141, __wbg_adapter_59);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper11542(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 2224, __wbg_adapter_62);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper11605(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 2243, __wbg_adapter_65);
    return addHeapObject(ret);
};

