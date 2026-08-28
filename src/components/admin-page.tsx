import { AdminFavorites } from "./admin-favorites";
import { AdminExtras } from "./admin-extras";

// CRA ADMIN INTEGRATION LAYER
// Keep the existing Admin implementation below this integration point.
// These components are intentionally isolated so Favorites and Extras can be
// enabled without changing Inventory, Products, or Combos logic.
export { AdminFavorites, AdminExtras };
