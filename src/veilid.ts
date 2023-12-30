import { VeilidConfigInner, VeilidWASMConfig } from "./pkg/veilid_wasm.js";

export const VEILID_WASM_CONFIG = {
	logging: {
		api: {
			enabled: true,
			level: "Info",
		},
		performance: {
			enabled: true,
			level: "Info",
			logs_in_console: false,
			logs_in_timings: true,
		},
	},
} satisfies VeilidWASMConfig;

export const VEILID_CORE_CONFIG = {
	program_name: "vldchat",
	namespace: "devminer",
	capabilities: {
		disable: [],
	},
	protected_store: {
		allow_insecure_fallback: true,
		always_use_insecure_storage: false,
		directory: "",
		delete: false,
		device_encryption_key_password: "test",
	},
	block_store: {
		directory: "",
		delete: false,
	},
	table_store: {
		directory: "",
		delete: false,
	},
	network: {
		connection_initial_timeout_ms: 2000,
		connection_inactivity_timeout_ms: 60_000,
		max_connections_per_ip4: 32,
		max_connections_per_ip6_prefix_size: 64,
		max_connections_per_ip6_prefix: 32,
		max_connection_frequency_per_min: 60,
		client_allowlist_timeout_ms: 30_000,
		reverse_connection_receipt_time_ms: 5_000,
		hole_punch_receipt_time_ms: 5_000,
		network_key_password: "",
		routing_table: {
			node_id: [],
			node_id_secret: [],
			bootstrap: [
				// "ws://vld.devminer.xyz:5150/ws",
				"wss://vld.devminer.xyz:5150/ws",

				// "ws://bootstrap.veilid.net:5150/ws",
				// FIXME: Commented out until they have a TLS certificate
				// "wss://bootstrap.veilid.net:5150/ws",
			],
			limit_over_attached: 64,
			limit_fully_attached: 32,
			limit_attached_strong: 16,
			limit_attached_good: 8,
			limit_attached_weak: 4,
		},
		rpc: {
			concurrency: 0,
			queue_size: 1024,
			max_timestamp_behind_ms: 10_000,
			max_timestamp_ahead_ms: 10_000,
			timeout_ms: 5_000,
			max_route_hop_count: 4,
			default_route_hop_count: 4,
		},
		dht: {
			max_find_node_count: 20,
			resolve_node_timeout_ms: 10_000,
			resolve_node_count: 1,
			resolve_node_fanout: 4,
			get_value_timeout_ms: 10_000,
			get_value_count: 3,
			get_value_fanout: 4,
			set_value_timeout_ms: 10_000,
			set_value_count: 5,
			set_value_fanout: 4,
			min_peer_count: 20,
			min_peer_refresh_time_ms: 60_000,
			validate_dial_info_receipt_time_ms: 2_000,
			local_subkey_cache_size: 128,
			local_max_subkey_cache_memory_mb: 128,
			remote_subkey_cache_size: 1024,
			remote_max_records: 65536,
			remote_max_subkey_cache_memory_mb: 128,
			remote_max_storage_space_mb: 0,
		},
		upnp: true,
		detect_address_changes: true,
		restricted_nat_retries: 0,
		application: {
			http: {
				enabled: false,
				listen_address: ":5150",
				path: "app",
			},
			https: {
				enabled: false,
				listen_address: ":5150",
				path: "app",
			},
		},
		tls: {
			certificate_path: "",
			private_key_path: "",
			connection_initial_timeout_ms: 2_000,
		},
		protocol: {
			udp: {
				enabled: false,
				listen_address: ":5150",
				socket_pool_size: 0,
			},
			tcp: {
				connect: false,
				listen: false,
				listen_address: ":5150",
				max_connections: 0,
			},
			ws: {
				connect: true,
				listen: true,
				listen_address: ":5150",
				max_connections: 16,
				path: "ws",
			},
			wss: {
				connect: true,
				listen: true,
				listen_address: "",
				max_connections: 16,
				path: "ws",
			},
		},
	},
} satisfies VeilidConfigInner;
