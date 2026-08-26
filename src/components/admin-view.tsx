import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ImagePlus, LogOut, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CraWordmark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { compressImage } from "@/lib/compress-image";
import { formatCLP } from "@/lib/format";
import {
  adminChangePin,
  adminCreateProduct,
  adminDeleteProduct,
  adminLogin,
  adminLogout,
  adminMe,
  adminUpdateIngredient,
  adminUpdateProduct,
  adminUpdateSettings,
} from "@/lib/server/admin";
import { getCatalog } from "@/lib/server/catalog";
import type { Catalog, CategoryId, Product } from "@/lib/types";
import { hasKitchenWhatsApp } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export function AdminView({ initial }: { initial: Catalog }) {
  const me = useQuery({ queryKey: ["admin-me"], queryFn: () => adminMe() });
  if (me.isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted">
        Cargando panel…
      </div>
    );
  }
  if (!me.data?.ok) {
    return <AdminLogin pinHint={initial.settings.pinHint} />;
  }
  return <AdminApp initial={initial} pinHint={me.data.pinHint} />;
}

function AdminLogin({ pinHint }: { pinHint: boolean }) {
  const qc = useQueryClient();
  const [pin, setPin] = useState("");
  const login = useMutation({
    mutationFn: () => adminLogin({ data: { pin } }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-me"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
      <CraWordmark />
      <h1 className="mt-8 font-display text-3xl font-semibold">Panel CRA</h1>
      <p className="mt-2 text-sm text-muted">
        Entra con el PIN de la cocina para subir fotos, escribir descripciones
        y cambiar precios.
      </p>
      {pinHint ? (
        <p className="mt-3 rounded-[var(--radius-md)] bg-surface-2 px-3 py-2 text-sm">
          PIN inicial: <span className="font-bold">cra2026</span> — cámbialo
          apenas entres.
        </p>
      ) : null}
      <form
        className="mt-6 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          login.mutate();
        }}
      >
        <Label htmlFor="pin">PIN</Label>
        <Input
          id="pin"
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          autoFocus
        />
        <Button className="w-full" type="submit" disabled={login.isPending}>
          Entrar
        </Button>
      </form>
      <Link to="/" className="mt-6 text-center text-sm text-muted">
        Volver al menú
      </Link>
    </div>
  );
}

function AdminApp({
  initial,
  pinHint,
}: {
  initial: Catalog;
  pinHint: boolean;
}) {
  const qc = useQueryClient();
  const catalogQuery = useQuery({
    queryKey: ["catalog"],
    queryFn: () => getCatalog(),
    initialData: initial,
  });
  const catalog = catalogQuery.data;
  const logout = useMutation({
    mutationFn: () => adminLogout(),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-me"] });
    },
  });

  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-4 py-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild aria-label="Menú">
            <Link to="/">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <CraWordmark compact />
        </div>
        <Button variant="secondary" size="sm" onClick={() => logout.mutate()}>
          <LogOut className="size-4" />
          Salir
        </Button>
      </div>

      <h1 className="mt-6 font-display text-3xl font-semibold">Cocina</h1>
      <p className="mt-1 text-sm text-muted">
        Sube fotos, escribe la descripción y cambia el precio. Se ve al tiro
        en el menú.
      </p>

      {pinHint ? (
        <p className="mt-3 rounded-[var(--radius-md)] bg-primary/15 px-3 py-2 text-sm font-medium text-heart">
          Sigue el PIN inicial. Cámbialo en Ajustes.
        </p>
      ) : null}

      {!hasKitchenWhatsApp(catalog.settings.whatsapp) ? (
        <p className="mt-3 rounded-[var(--radius-md)] bg-surface-2 px-3 py-2 text-sm">
          Falta el WhatsApp de la cocina en Ajustes. Sin ese número el cliente
          igual abre WhatsApp con el pedido completo.
        </p>
      ) : null}

      <Tabs defaultValue="productos" className="mt-6">
        <TabsList className="w-full">
          <TabsTrigger value="productos">Productos</TabsTrigger>
          <TabsTrigger value="ingredientes">Ingredientes</TabsTrigger>
          <TabsTrigger value="ajustes">Ajustes</TabsTrigger>
        </TabsList>
        <TabsContent value="productos" className="mt-4">
          <ProductsAdmin catalog={catalog} />
        </TabsContent>
        <TabsContent value="ingredientes" className="mt-4">
          <IngredientsAdmin catalog={catalog} />
        </TabsContent>
        <TabsContent value="ajustes" className="mt-4">
          <SettingsAdmin catalog={catalog} pinHint={pinHint} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function applyCatalog(qc: ReturnType<typeof useQueryClient>, catalog: Catalog) {
  qc.setQueryData(["catalog"], catalog);
}

function ProductsAdmin({ catalog }: { catalog: Catalog }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<CategoryId | "all">("empanadas");
  const list = catalog.products.filter(
    (p) => filter === "all" || p.categoryId === filter,
  );
  const update = useMutation({
    mutationFn: (data: Parameters<typeof adminUpdateProduct>[0]["data"]) =>
      adminUpdateProduct({ data }),
    onSuccess: (c) => {
      applyCatalog(qc, c);
      toast.success("Guardado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const create = useMutation({
    mutationFn: (data: Parameters<typeof adminCreateProduct>[0]["data"]) =>
      adminCreateProduct({ data }),
    onSuccess: (c) => {
      applyCatalog(qc, c);
      toast.success("Producto creado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: number) => adminDeleteProduct({ data: { id } }),
    onSuccess: (c) => applyCatalog(qc, c),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto">
        {(["all", ...catalog.categories.map((c) => c.id)] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              "h-9 shrink-0 rounded-full px-3 text-sm font-semibold",
              filter === id ? "bg-primary text-primary-foreground" : "bg-surface-2",
            )}
          >
            {id === "all"
              ? "Todos"
              : catalog.categories.find((c) => c.id === id)?.name}
          </button>
        ))}
      </div>
      <NewProductForm
        onCreate={(data) => create.mutate(data)}
        pending={create.isPending}
      />
      {list.map((product) => (
        <ProductEditor
          key={product.id}
          product={product}
          onPatch={(patch) => update.mutate({ id: product.id, ...patch })}
          onDelete={() => remove.mutate(product.id)}
          pending={update.isPending}
        />
      ))}
    </div>
  );
}

function NewProductForm({
  onCreate,
  pending,
}: {
  onCreate: (data: {
    categoryId: CategoryId;
    name: string;
    price: number;
    description?: string;
    imageUrl?: string;
  }) => void;
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("3000");
  const [categoryId, setCategoryId] = useState<CategoryId>("empanadas");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      setImageUrl(await compressImage(file));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir");
    } finally {
      setUploading(false);
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Nuevo producto
      </Button>
    );
  }
  return (
    <form
      className="space-y-3 rounded-[var(--radius-lg)] bg-surface p-4 shadow-[var(--shadow-border)]"
      onSubmit={(e) => {
        e.preventDefault();
        onCreate({
          categoryId,
          name: name.trim(),
          price: Number(price) || 0,
          description: description.trim(),
          imageUrl: imageUrl || undefined,
        });
        setName("");
        setDescription("");
        setPrice("3000");
        setImageUrl("");
        setOpen(false);
      }}
    >
      <p className="font-semibold">Nuevo producto</p>
      <PhotoPicker
        imageUrl={imageUrl}
        uploading={uploading}
        onFile={(f) => void onFile(f)}
      />
      <div className="space-y-1">
        <Label>Nombre</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre en el menú"
          required
        />
      </div>
      <div className="space-y-1">
        <Label>Descripción</Label>
        <Textarea
          className="min-h-20"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Qué lleva, cómo se come…"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>Categoría</Label>
          <select
            className="h-11 w-full rounded-[var(--radius-md)] bg-bg px-3 text-sm shadow-[var(--shadow-border)]"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value as CategoryId)}
          >
            <option value="empanadas">Empanadas</option>
            <option value="fajitas">Fajitas</option>
            <option value="papas">Papas</option>
            <option value="bebidas">Bebidas</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label>Precio (CLP)</Label>
          <Input
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
            placeholder="Precio"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending || uploading}>
          Guardar
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function ProductEditor({
  product,
  onPatch,
  onDelete,
  pending,
}: {
  product: Product;
  onPatch: (patch: {
    name?: string;
    description?: string;
    price?: number;
    available?: boolean;
    imageUrl?: string;
  }) => void;
  onDelete: () => void;
  pending: boolean;
}) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState(String(product.price));
  const [uploading, setUploading] = useState(false);

  const dirty =
    name.trim() !== product.name ||
    description !== product.description ||
    (Number(price) || 0) !== product.price;

  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const imageUrl = await compressImage(file);
      onPatch({ imageUrl });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir");
    } finally {
      setUploading(false);
    }
  }

  return (
    <article className="rounded-[var(--radius-lg)] bg-surface p-3 shadow-[var(--shadow-border)]">
      <div className="flex gap-3">
        <PhotoPicker
          imageUrl={product.imageUrl}
          uploading={uploading}
          onFile={(f) => void onFile(f)}
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="space-y-1">
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1 space-y-1">
              <Label>Precio (CLP)</Label>
              <Input
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <span className="mb-2.5 shrink-0 text-xs font-semibold text-heart">
              {formatCLP(Number(price) || 0)}
            </span>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <span className="text-xs text-muted">
              {product.available ? "Visible en el menú" : "Oculto"}
            </span>
            <Switch
              checked={product.available}
              onCheckedChange={(available) => onPatch({ available })}
            />
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <Label>Descripción</Label>
        <Textarea
          className="min-h-20"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe el plato para el menú"
        />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-heart"
        >
          <Trash2 className="size-4" />
          Quitar
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!dirty || pending}
          onClick={() =>
            onPatch({
              name: name.trim() || product.name,
              description,
              price: Number(price) || 0,
            })
          }
        >
          Guardar cambios
        </Button>
      </div>
    </article>
  );
}

function PhotoPicker({
  imageUrl,
  uploading,
  onFile,
}: {
  imageUrl: string;
  uploading: boolean;
  onFile: (file: File | undefined) => void;
}) {
  return (
    <label className="relative size-28 shrink-0 cursor-pointer overflow-hidden rounded-[var(--radius-md)] bg-surface-2">
      {imageUrl ? (
        <img src={imageUrl} alt="" className="size-full object-cover" />
      ) : (
        <span className="flex size-full flex-col items-center justify-center gap-1 text-muted">
          <ImagePlus className="size-6" />
          <span className="text-[10px] font-bold uppercase tracking-wide">
            Foto
          </span>
        </span>
      )}
      <span className="absolute inset-x-0 bottom-0 bg-fg/60 py-1 text-center text-[10px] font-bold text-primary-foreground">
        {uploading ? "Subiendo…" : imageUrl ? "Cambiar foto" : "Subir foto"}
      </span>
      <input
        type="file"
        accept="image/*"
        className="absolute inset-0 z-10 cursor-pointer opacity-0"
        disabled={uploading}
        onChange={(e) => onFile(e.target.files?.[0])}
      />
    </label>
  );
}

function IngredientsAdmin({ catalog }: { catalog: Catalog }) {
  const qc = useQueryClient();
  const update = useMutation({
    mutationFn: (data: Parameters<typeof adminUpdateIngredient>[0]["data"]) =>
      adminUpdateIngredient({ data }),
    onSuccess: (c) => applyCatalog(qc, c),
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted">
        El extra aplica a Arma tu fajita. En empanadas, mechada y llanero suman
        el extra premium.
      </p>
      {catalog.ingredients.map((ing) => (
        <div
          key={ing.id}
          className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] bg-surface p-3 shadow-[var(--shadow-border)]"
        >
          <div className="min-w-32 flex-1">
            <p className="font-semibold">{ing.name}</p>
            <p className="text-xs text-muted">
              {ing.empanadaOk ? "Empanada" : ""}
              {ing.empanadaOk && ing.fajitaOk ? " · " : ""}
              {ing.fajitaOk ? "Fajita" : ""}
              {ing.premium ? " · premium" : ""}
            </p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Extra fajita</Label>
            <Input
              className="w-24"
              inputMode="numeric"
              defaultValue={String(ing.fajitaPrice)}
              onBlur={(e) => {
                const n = Number(e.target.value.replace(/\D/g, "")) || 0;
                if (n !== ing.fajitaPrice) {
                  update.mutate({ id: ing.id, fajitaPrice: n });
                }
              }}
            />
          </div>
          <Switch
            checked={ing.available}
            onCheckedChange={(available) =>
              update.mutate({ id: ing.id, available })
            }
          />
        </div>
      ))}
    </div>
  );
}

function SettingsAdmin({
  catalog,
  pinHint,
}: {
  catalog: Catalog;
  pinHint: boolean;
}) {
  const qc = useQueryClient();
  const s = catalog.settings;
  const [form, setForm] = useState({
    restaurantName: s.restaurantName,
    tagline: s.tagline,
    city: s.city,
    hours: s.hours,
    whatsapp: s.whatsapp,
    transferBank: s.transferBank,
    transferName: s.transferName,
    transferRut: s.transferRut,
    transferAccount: s.transferAccount,
    empanada1: String(s.empanada1),
    empanada2: String(s.empanada2),
    empanada3: String(s.empanada3),
    empanadaPremium: String(s.empanadaPremium),
    fajitaBase: String(s.fajitaBase),
  });
  const [pins, setPins] = useState({ current: "", next: "" });

  const save = useMutation({
    mutationFn: () =>
      adminUpdateSettings({
        data: {
          restaurantName: form.restaurantName,
          tagline: form.tagline,
          city: form.city,
          hours: form.hours,
          whatsapp: form.whatsapp,
          transferBank: form.transferBank,
          transferName: form.transferName,
          transferRut: form.transferRut,
          transferAccount: form.transferAccount,
          empanada1: Number(form.empanada1) || 0,
          empanada2: Number(form.empanada2) || 0,
          empanada3: Number(form.empanada3) || 0,
          empanadaPremium: Number(form.empanadaPremium) || 0,
          fajitaBase: Number(form.fajitaBase) || 0,
        },
      }),
    onSuccess: (c) => {
      applyCatalog(qc, c);
      toast.success("Ajustes guardados");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changePin = useMutation({
    mutationFn: () => adminChangePin({ data: pins }),
    onSuccess: async () => {
      toast.success("PIN actualizado");
      setPins({ current: "", next: "" });
      await qc.invalidateQueries({ queryKey: ["admin-me"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const fields = useMemo(
    () =>
      [
        ["whatsapp", "WhatsApp de la cocina (569…)"],
        ["restaurantName", "Nombre"],
        ["tagline", "Frase"],
        ["city", "Zona / ciudad"],
        ["hours", "Horario"],
        ["transferBank", "Banco"],
        ["transferName", "Titular"],
        ["transferRut", "RUT"],
        ["transferAccount", "Cuenta"],
      ] as const,
    [],
  );

  return (
    <div className="space-y-6">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        {fields.map(([key, label]) => (
          <div key={key} className="space-y-1">
            <Label>{label}</Label>
            {key === "whatsapp" ? (
              <p className="text-xs text-muted">
                Con código de país, sin +. Ej: 56912345678. Ahí llega el pedido
                completo.
              </p>
            ) : null}
            <Input
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </div>
        ))}
        <p className="pt-2 text-sm font-semibold">Arma tu empanada</p>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["empanada1", "1 ingrediente"],
              ["empanada2", "2 ingredientes"],
              ["empanada3", "3 ingredientes"],
              ["empanadaPremium", "Extra premium"],
              ["fajitaBase", "Base fajita"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-1">
              <Label>{label}</Label>
              <Input
                inputMode="numeric"
                value={form[key]}
                onChange={(e) =>
                  setForm({ ...form, [key]: e.target.value.replace(/\D/g, "") })
                }
              />
            </div>
          ))}
        </div>
        <Button type="submit" disabled={save.isPending}>
          Guardar ajustes
        </Button>
      </form>

      <form
        className="space-y-3 rounded-[var(--radius-lg)] bg-surface p-4 shadow-[var(--shadow-border)]"
        onSubmit={(e) => {
          e.preventDefault();
          changePin.mutate();
        }}
      >
        <p className="font-semibold">Cambiar PIN</p>
        {pinHint ? (
          <p className="text-sm text-muted">
            El actual es cra2026 hasta que lo cambies.
          </p>
        ) : null}
        <Input
          type="password"
          placeholder="PIN actual"
          value={pins.current}
          onChange={(e) => setPins({ ...pins, current: e.target.value })}
        />
        <Input
          type="password"
          placeholder="PIN nuevo"
          value={pins.next}
          onChange={(e) => setPins({ ...pins, next: e.target.value })}
        />
        <Button type="submit" variant="secondary" disabled={changePin.isPending}>
          Actualizar PIN
        </Button>
      </form>
    </div>
  );
}
