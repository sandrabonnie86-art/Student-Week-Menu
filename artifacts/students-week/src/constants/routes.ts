export const ROUTES = {
  HOME: "/",
  VENDORS: "/vendors",
  MENU: "/menu/:vendorId",
  ORDER_COMPLETE: "/order-complete",
  // Admin Routes (Obscured)
  ADMIN_LOGIN: "/x7f4k9-admin-login",
  ADMIN: "/x7f4k9-admin",
  ADMIN_DASHBOARD: "/x7f4k9-admin",
  ADMIN_VENDORS: "/x7f4k9-admin/vendors",
  ADMIN_TABLES: "/x7f4k9-admin/tables",
  ADMIN_MENU: "/x7f4k9-admin/menu",
  ADMIN_HISTORY: "/x7f4k9-admin/history",
  ADMIN_CONFIG: "/x7f4k9-admin/config",
  // Usher Routes (Obscured)
  USHER_LOGIN: "/m3p8q2-usher-login",
  USHER: "/m3p8q2-usher",
  USHER_DASHBOARD: "/m3p8q2-usher",
  USHER_TABLES: "/m3p8q2-usher/tables",
  // Vendor Routes (Obscured)
  VENDOR_LOGIN: "/z9n2w5-vendor-login",
  VENDOR_DASHBOARD: "/z9n2w5-vendor",
} as const;
