// Structural constants that never change
pub const ANCHOR_DISCRIMINATOR: usize = 8;
pub const BASIS_POINTS_MAX: u64 = 10_000;

// Account sizing constants - upper bounds for Proposal account allocation
// These are NOT governance parameters; they define the max possible account size
pub const MAX_TITLE_ACCOUNT_SIZE: usize = 200;
pub const MAX_DESC_ACCOUNT_SIZE: usize = 500;

// Hard upper bound on the admin-configurable `max_supporters` cap. Every support
// call must deserialize and re-tally the whole `supporters` list in a single
// transaction; the binding limit is the 256KB max requestable heap frame, which
// is exhausted somewhere around 2,500-3,000 supporters. This ceiling keeps even
// the largest configurable value comfortably below that, while still exceeding
// the count of active mainnet validators (~1,300-1,500).
pub const MAX_SUPPORTERS_LIMIT: u32 = 2_000;
