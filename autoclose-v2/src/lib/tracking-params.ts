/**
 * URL parameters known to be dynamic/tracking that should be stripped
 * for "loose matching" mode. Organised by source.
 */
export const TRACKING_PARAMS: string[] = [
	// Platform click IDs (change every click)
	"fbclid", "gclid", "gclsrc", "dclid", "msclkid", "twclid",
	"ttclid", "yclid", "ysclid", "li_fat_id", "igshid", "igsh", "si",

	// UTM parameters
	"utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
	"utm_id", "utm_name", "utm_reader", "utm_referrer",

	// Google
	"_ga", "_gl", "_gac", "gad_source", "gbraid", "wbraid",
	"sxsrf", "ved", "ei", "usg",

	// Facebook/Meta
	"__cft__[0]", "__tn__", "hc_ref", "mibextid",

	// HubSpot
	"_hsenc", "_hsmi", "__hsfp", "__hssc", "__hstc",

	// Mailchimp
	"mc_cid", "mc_eid",

	// Adobe
	"ef_id", "s_kwcid",

	// Marketo
	"mkt_tok",

	// Generic tracking
	"ref", "refId", "tracking_id", "trk", "clickid",

	// Session/dynamic
	"gcl_experience_id", "params_json", "nonce", "timestamp",
]
