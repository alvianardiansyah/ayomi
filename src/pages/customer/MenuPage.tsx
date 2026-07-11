import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingCart,
  Search,
  Star,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { menuService } from "@/services/menuService";
import { categoryService } from "@/services/categoryService";
import { tableService } from "@/services/tableService";
import { settingsService } from "@/services/settingsService";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency, getOrCreateCustomerSession } from "@/lib/utils";
import type { Menu } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";

export default function CustomerMenuPage() {
  const [searchParams] = useSearchParams();
  const tableUuid = searchParams.get("table");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { addItem, totalItems, setTable, setCustomerSession, tableId } =
    useCartStore();

  // Cek apakah user datang dari scan QR (ada parameter table)
  const isFromQR = !!tableUuid;

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsService.get(),
  });

  const { data: table } = useQuery({
    queryKey: ["table", tableUuid],
    queryFn: () => tableService.getByUuid(tableUuid!),
    enabled: !!tableUuid,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getAll(),
  });

  const { data: menus = [], isLoading } = useQuery({
    queryKey: ["menus", selectedCategory],
    queryFn: () => menuService.getAvailable(selectedCategory || undefined),
  });

  useEffect(() => {
    const session = getOrCreateCustomerSession();
    setCustomerSession(session);
  }, [setCustomerSession]);

  useEffect(() => {
    if (table) {
      setTable(table.id, table.table_number);
    }
  }, [table, setTable]);

  // Perbaikan: Hanya satu definisi filteredMenus
  const filteredMenus = menus.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeCategories = categories.filter((c) => c.is_active);

  const cartCount = totalItems();

  // Handler untuk menambahkan item ke keranjang (hanya jika dari QR)
  const handleAddToCart = (menu: Menu) => {
    if (!isFromQR) {
      toast.error("Silakan scan QR Code meja untuk memesan");
      return;
    }
    if (!tableId && tableUuid) {
      toast.error("Memuat informasi meja...");
      return;
    }
    addItem(menu);
    toast.success(`${menu.name} ditambahkan`);
  };

  // Debug untuk memastikan data ada
  console.log("isFromQR:", isFromQR);
  console.log("tableUuid:", tableUuid);
  console.log("menus length:", menus.length);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="font-bold text-lg text-foreground">
                {settings?.restaurant_name || "Ayomi Pesan"}
              </h1>
              {table && isFromQR && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <span>🪑</span>
                  <span>Meja {table.table_number}</span>
                </p>
              )}
              {!isFromQR && (
                <div className="flex items-center gap-1 text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full mt-0.5">
                  <AlertCircle className="w-3 h-3" />
                  <span>Mode Lihat Menu</span>
                </div>
              )}
            </div>
            {isFromQR && (
              <Button
                onClick={() => navigate("/cart")}
                className="relative"
                size="sm"
              >
                <ShoppingCart className="w-4 h-4" />
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 1.5 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-white text-xs rounded-full flex items-center justify-center font-bold"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari menu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-gray-50 border-gray-200"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="max-w-2xl mx-auto px-4 pb-3 overflow-x-auto">
          <div className="flex gap-2 w-max">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                !selectedCategory
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Semua
            </button>
            {activeCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1 ${
                  selectedCategory === cat.id
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat.icon && <span>{cat.icon}</span>}
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Banner untuk mode view only */}
      {!isFromQR && (
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 font-medium">
                Mode Lihat Menu
              </p>
              <p className="text-xs text-blue-600">
                Anda hanya dapat melihat menu. Untuk memesan, silakan scan QR
                Code yang tersedia di meja.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Menu Grid */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden">
                <Skeleton className="h-36 w-full" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredMenus.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-muted-foreground font-medium">
              Menu tidak ditemukan
            </p>
            <p className="text-sm text-muted-foreground">
              Coba kata kunci lain
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence>
              {filteredMenus.map((menu, i) => (
                <MenuCard
                  key={menu.id}
                  menu={menu}
                  index={i}
                  onAdd={() => handleAddToCart(menu)}
                  isFromQR={isFromQR}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Floating Cart Button - Hanya muncul jika dari QR dan ada item di keranjang */}
      {isFromQR && cartCount > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-6 left-0 right-0 px-4 z-50 max-w-2xl mx-auto"
        >
          <button
            onClick={() => navigate("/cart")}
            className="w-full bg-primary text-white rounded-2xl py-4 px-5 flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-3">
              <span className="bg-white/20 text-white rounded-lg w-7 h-7 flex items-center justify-center text-sm font-bold">
                {cartCount}
              </span>
              <span className="font-semibold">Lihat Pesanan</span>
            </div>
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </div>
  );
}

function MenuCard({
  menu,
  index,
  onAdd,
  isFromQR,
}: {
  menu: Menu;
  index: number;
  onAdd: () => void;
  isFromQR: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 ${
        !menu.is_available ? "opacity-60" : ""
      }`}
    >
      {/* Image */}
      <div className="relative h-32 bg-gray-100 overflow-hidden">
        {menu.image_url ? (
          <img
            src={menu.image_url}
            alt={menu.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            🍽️
          </div>
        )}
        {menu.is_best_seller && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Star className="w-3 h-3" fill="white" />
            Best Seller
          </div>
        )}
        {!menu.is_available && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-sm font-semibold bg-black/60 px-3 py-1 rounded-full">
              Habis
            </span>
          </div>
        )}
        {/* Overlay jika mode view only */}
        {!isFromQR && menu.is_available && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <span className="text-white text-xs font-semibold bg-black/50 px-3 py-1 rounded-full flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Lihat Saja
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-sm text-foreground line-clamp-1">
          {menu.name}
        </h3>
        {menu.description && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {menu.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-primary font-bold text-sm">
            {formatCurrency(menu.price)}
          </span>
          {isFromQR ? (
            <button
              onClick={onAdd}
              disabled={!menu.is_available}
              className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg disabled:opacity-50 active:scale-95 transition-transform"
            >
              +
            </button>
          ) : (
            <div className="w-7 h-7 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center text-xs font-medium">
              🔒
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
