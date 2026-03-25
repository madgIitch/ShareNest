import { useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Switch, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import LocationPicker, { LocationResult } from "../../src/components/map/LocationPicker";

// ─── Types ──────────────────────────────────────────────────────────────────

type BedType = "individual" | "doble" | "litera" | "flexible";
type BillStatus = "included" | "extra" | "not_included";
interface Bill { key: string; label: string; emoji: string; status: BillStatus; }
interface Roommate { id: string; name: string; username: string; status: "pending" | "confirmed"; }

const STEPS = [
  { label: "Habitación" },
  { label: "Ubicación" },
  { label: "Convivientes" },
  { label: "Gastos" },
  { label: "Publicar" },
];

const BED_OPTIONS: { key: BedType; label: string; emoji: string }[] = [
  { key: "individual", label: "Individual", emoji: "🛏" },
  { key: "doble", label: "Doble", emoji: "🛌" },
  { key: "litera", label: "Litera", emoji: "🪜" },
  { key: "flexible", label: "Flexible", emoji: "🔄" },
];

const DEFAULT_BILLS: Bill[] = [
  { key: "electricity", label: "Luz", emoji: "💡", status: "included" },
  { key: "water", label: "Agua", emoji: "💧", status: "included" },
  { key: "gas", label: "Gas", emoji: "🔥", status: "extra" },
  { key: "internet", label: "Internet", emoji: "📶", status: "included" },
  { key: "cleaning", label: "Limpieza", emoji: "🧹", status: "not_included" },
];

// ─── Main Wizard ─────────────────────────────────────────────────────────────

export default function PublishWizard() {
  const [step, setStep] = useState(0);
  const [publishing, setPublishing] = useState(false);

  // Step 1 — Room
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [bedType, setBedType] = useState<BedType | null>(null);
  const [hasPrivateBath, setHasPrivateBath] = useState(false);
  const [hasDesk, setHasDesk] = useState(false);
  const [isFurnished, setIsFurnished] = useState(false);
  const [allowsPets, setAllowsPets] = useState(false);

  // Step 2 — Location
  const [location, setLocation] = useState<LocationResult | null>(null);

  // Step 3 — Roommates
  const [roommates, setRoommates] = useState<Roommate[]>([]);

  // Step 4 — Bills
  const [bills, setBills] = useState<Bill[]>(DEFAULT_BILLS);
  const [useExpensesApp, setUseExpensesApp] = useState(true);

  // Step 5 — Publish
  const [publishActive, setPublishActive] = useState(true);

  // ── Navigation ────────────────────────────────────────────────────────────

  const goNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else handlePublish();
  };

  const goPrev = () => {
    if (step > 0) setStep(step - 1);
    else router.back();
  };

  // ── Publish ───────────────────────────────────────────────────────────────

  const handlePublish = async () => {
    setPublishing(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { Alert.alert("Error", "Sesión expirada"); setPublishing(false); return; }

    const billsConfig: Record<string, string> = {};
    bills.forEach((b) => { billsConfig[b.key] = b.status; });

    const { error } = await (supabase.from("room_listings") as any).insert({
      publisher_id: user.id,
      title: title || "Mi habitación",
      price: Number(price) || 0,
      bed_type: bedType as any,
      has_private_bath: hasPrivateBath,
      has_desk: hasDesk,
      is_furnished: isFurnished,
      allows_pets: allowsPets,
      lat: location?.lat ?? null,
      lng: location?.lng ?? null,
      address_full: location?.address_full ?? null,
      address_approx: location?.address_short ?? null,
      city_id: "madrid", // TODO: resolve from geocoding result
      bills_config: billsConfig,
      status: publishActive ? "active" : "draft",
    });

    setPublishing(false);
    if (error) { Alert.alert("Error al publicar", error.message); return; }
    Alert.alert("¡Publicado!", "Tu habitación ya está visible.", [
      { text: "Ver anuncios", onPress: () => router.replace("/(tabs)") },
    ]);
  };

  // ── Roommate helpers ──────────────────────────────────────────────────────

  const addRoommate = () => {
    Alert.prompt(
      "Añadir conviviente",
      "Introduce el @username:",
      (username) => {
        if (!username) return;
        setRoommates((prev) => [
          ...prev,
          { id: Date.now().toString(), name: username, username: `@${username}`, status: "pending" },
        ]);
      }
    );
  };

  const importFromHousehold = () => {
    setRoommates((prev) => {
      const already = prev.find((r) => r.username === "@sara_garcia");
      if (already) return prev;
      return [...prev, { id: "hh-1", name: "Sara García", username: "@sara_garcia", status: "confirmed" }];
    });
  };

  // ── Bills helpers ─────────────────────────────────────────────────────────

  const cycleBillStatus = (key: string, to: BillStatus) => {
    setBills((prev) =>
      prev.map((b) => (b.key === key ? { ...b, status: b.status === to ? "not_included" : to } : b))
    );
  };

  // ── Checklist for step 5 ──────────────────────────────────────────────────

  const checklist = [
    { label: "Precio y características completos", ok: !!price && !!bedType },
    { label: "Ubicación confirmada", ok: !!location },
    { label: roommates.length === 0 ? "Sin fotos — recomendamos añadir al menos 3" : `${roommates.length} conviviente${roommates.length > 1 ? "s" : ""} invitado${roommates.length > 1 ? "s" : ""}`, ok: roommates.length > 0, warn: roommates.length === 0 },
    { label: "Gastos configurados", ok: true },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111111" />
      <SafeAreaView style={s.safeTop} edges={["top"]}>

        {/* Top tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabsScroll}
        >
          {STEPS.map((st, i) => (
            <TouchableOpacity
              key={i}
              style={[s.tab, i === step && s.tabActive]}
              onPress={() => setStep(i)}
            >
              <Text style={[s.tabText, i === step && s.tabTextActive]}>
                {i + 1} · {st.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Step header */}
        <View style={s.stepHeader}>
          <TouchableOpacity style={s.iconBtn} onPress={goPrev} hitSlop={12}>
            <Ionicons name="arrow-back" size={18} color="#ccc" />
          </TouchableOpacity>
          <Text style={s.stepCounter}>Paso {step + 1} de {STEPS.length}</Text>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={18} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={s.progressBar}>
          {STEPS.map((_, i) => (
            <View key={i} style={[s.progressSegment, i <= step && s.progressSegmentActive]} />
          ))}
        </View>

      </SafeAreaView>

      {/* Step content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={s.content}
          contentContainerStyle={s.contentInner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 0 && (
            <Step1
              title={title} onTitleChange={setTitle}
              price={price} onPriceChange={setPrice}
              bedType={bedType} onBedTypeChange={setBedType}
              hasPrivateBath={hasPrivateBath} onHasPrivateBathChange={setHasPrivateBath}
              hasDesk={hasDesk} onHasDeskChange={setHasDesk}
              isFurnished={isFurnished} onIsFurnishedChange={setIsFurnished}
              allowsPets={allowsPets} onAllowsPetsChange={setAllowsPets}
            />
          )}
          {step === 1 && (
            <Step2 location={location} onLocationChange={setLocation} />
          )}
          {step === 2 && (
            <Step3
              roommates={roommates}
              onImportHousehold={importFromHousehold}
              onAddRoommate={addRoommate}
              onRemoveRoommate={(id: string) => setRoommates((p) => p.filter((r) => r.id !== id))}
            />
          )}
          {step === 3 && (
            <Step4
              bills={bills}
              onCycleBill={cycleBillStatus}
              useExpensesApp={useExpensesApp}
              onUseExpensesAppChange={setUseExpensesApp}
            />
          )}
          {step === 4 && (
            <Step5
              title={title}
              price={price}
              location={location}
              roommates={roommates}
              checklist={checklist}
              publishActive={publishActive}
              onPublishActiveChange={setPublishActive}
            />
          )}
        </ScrollView>

        {/* Bottom CTA */}
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.continueBtn, publishing && { opacity: 0.6 }]}
            onPress={goNext}
            disabled={publishing}
            activeOpacity={0.85}
          >
            {publishing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={s.continueBtnText}>
                  {step === STEPS.length - 1 ? "Publicar habitación" : "Continuar"}
                </Text>
                <Ionicons
                  name={step === STEPS.length - 1 ? "paper-plane-outline" : "arrow-forward"}
                  size={18}
                  color="#fff"
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Step 1 — La habitación ───────────────────────────────────────────────────

function Step1({
  title, onTitleChange, price, onPriceChange, bedType, onBedTypeChange,
  hasPrivateBath, onHasPrivateBathChange, hasDesk, onHasDeskChange,
  isFurnished, onIsFurnishedChange, allowsPets, onAllowsPetsChange,
}: any) {
  return (
    <>
      <Text style={s.stepTitle}>La habitación</Text>
      <Text style={s.stepSubtitle}>Cuéntanos qué ofreces</Text>

      <Label>TÍTULO DEL ANUNCIO</Label>
      <TextInput
        style={s.input}
        placeholder="Habitación luminosa en Malasaña"
        placeholderTextColor="#444"
        value={title}
        onChangeText={onTitleChange}
      />

      <Label>PRECIO MENSUAL</Label>
      <View style={s.priceWrap}>
        <Text style={s.priceEuro}>€</Text>
        <TextInput
          style={[s.input, s.priceInput]}
          keyboardType="number-pad"
          placeholder="620"
          placeholderTextColor="#444"
          value={price}
          onChangeText={onPriceChange}
        />
        <Text style={s.priceSuffix}>/mes</Text>
      </View>

      <Label>TIPO DE CAMA</Label>
      <View style={s.bedGrid}>
        {BED_OPTIONS.map((o) => (
          <TouchableOpacity
            key={o.key}
            style={[s.bedOption, bedType === o.key && s.bedOptionActive]}
            onPress={() => onBedTypeChange(o.key)}
            activeOpacity={0.8}
          >
            <Text style={s.bedEmoji}>{o.emoji}</Text>
            <Text style={[s.bedLabel, bedType === o.key && s.bedLabelActive]}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Label>CARACTERÍSTICAS</Label>
      <View style={s.toggleList}>
        <ToggleRow emoji="🚿" label="Baño privado" value={hasPrivateBath} onChange={onHasPrivateBathChange} />
        <ToggleRow emoji="🪑" label="Escritorio" value={hasDesk} onChange={onHasDeskChange} />
        <ToggleRow emoji="🛋️" label="Amueblada" value={isFurnished} onChange={onIsFurnishedChange} />
        <ToggleRow emoji="🐾" label="Mascotas permitidas" value={allowsPets} onChange={onAllowsPetsChange} last />
      </View>
    </>
  );
}

// ─── Step 2 — Ubicación ───────────────────────────────────────────────────────

function Step2({ location, onLocationChange }: { location: LocationResult | null; onLocationChange: (l: LocationResult) => void }) {
  return (
    <>
      <Text style={s.stepTitle}>¿Dónde está?</Text>
      <Text style={s.stepSubtitle}>Mueve el pin para ajustar la ubicación exacta</Text>

      <LocationPicker
        initialLat={40.4168}
        initialLng={-3.7038}
        onLocationChange={onLocationChange}
        style={s.mapBox}
      />

      {location ? (
        <View style={s.addressCard}>
          <View style={s.addressCheck}>
            <Ionicons name="checkmark" size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.addressMain} numberOfLines={1}>
              {location.address_short || location.address_full || "Dirección seleccionada"}
            </Text>
            <Text style={s.addressSub} numberOfLines={1}>
              {[location.suburb, location.city, location.postcode].filter(Boolean).join(" · ")}
            </Text>
          </View>
          <TouchableOpacity hitSlop={12}>
            <Text style={s.editLink}>Editar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.addressCardEmpty}>
          <Ionicons name="location-outline" size={18} color="#555" />
          <Text style={s.addressEmptyText}>Mueve el pin para seleccionar la dirección</Text>
        </View>
      )}

      <View style={s.infoBox}>
        <Ionicons name="information-circle-outline" size={16} color="#555" />
        <Text style={s.infoText}>
          Los visitantes solo ven el barrio y la calle aproximada. La dirección exacta se revela cuando aceptas a alguien.
        </Text>
      </View>
    </>
  );
}

// ─── Step 3 — Convivientes ────────────────────────────────────────────────────

function Step3({ roommates, onImportHousehold, onAddRoommate, onRemoveRoommate }: any) {
  return (
    <>
      <Text style={s.stepTitle}>¿Quién vive aquí?</Text>
      <Text style={s.stepSubtitle}>
        Añade a tus convivientes para generar confianza. Recibirán una invitación para confirmar.
      </Text>

      {/* Household banner */}
      <View style={s.householdBanner}>
        <View style={s.householdIcon}>
          <Text style={{ fontSize: 18 }}>🏠</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.householdTitle}>Tienes un household activo</Text>
          <Text style={s.householdSub}>Piso en Malasaña · 2 miembros</Text>
        </View>
      </View>
      <TouchableOpacity style={s.importBtn} onPress={onImportHousehold} activeOpacity={0.8}>
        <Text style={s.importBtnText}>Importar convivientes del household</Text>
      </TouchableOpacity>

      <Label>CONVIVIENTES AÑADIDOS</Label>
      <View style={s.roommateList}>
        {roommates.map((r: Roommate) => (
          <View key={r.id} style={s.roommateRow}>
            <View style={[s.roommateAvatar, { backgroundColor: r.status === "confirmed" ? "#1D4ED8" : "#7C3AED" }]}>
              <Text style={s.roommateInitial}>{r.name[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.roommateName}>{r.name}</Text>
              <Text style={s.roommateUsername}>{r.username}</Text>
            </View>
            <View style={[s.statusBadge, r.status === "confirmed" ? s.statusGreen : s.statusOrange]}>
              <Text style={[s.statusText, r.status === "confirmed" ? s.statusTextGreen : s.statusTextOrange]}>
                {r.status === "confirmed" ? "Confirmado" : "Pendiente"}
              </Text>
            </View>
            <TouchableOpacity onPress={() => onRemoveRoommate(r.id)} hitSlop={10} style={{ marginLeft: 8 }}>
              <Ionicons name="close" size={14} color="#555" />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={s.addRoommateBtn} onPress={onAddRoommate} activeOpacity={0.8}>
          <Ionicons name="add" size={18} color="#666" />
          <Text style={s.addRoommateBtnText}>Añadir conviviente</Text>
        </TouchableOpacity>
      </View>

      <View style={s.infoBox}>
        <Ionicons name="information-circle-outline" size={16} color="#555" />
        <Text style={s.infoText}>
          Cada conviviente decide si aparecer públicamente en el anuncio. Los que no confirmen aparecerán como "conviviente anónimo".
        </Text>
      </View>
    </>
  );
}

// ─── Step 4 — Gastos ─────────────────────────────────────────────────────────

function Step4({ bills, onCycleBill, useExpensesApp, onUseExpensesAppChange }: any) {
  return (
    <>
      <Text style={s.stepTitle}>Gastos del piso</Text>
      <Text style={s.stepSubtitle}>Indica qué está incluido en el precio para evitar sorpresas</Text>

      <View style={s.billList}>
        {(bills as Bill[]).map((bill, i) => (
          <View key={bill.key} style={[s.billRow, i < bills.length - 1 && s.billRowBorder]}>
            <Text style={s.billEmoji}>{bill.emoji}</Text>
            <Text style={s.billLabel}>{bill.label}</Text>
            <View style={s.billActions}>
              <TouchableOpacity
                style={[s.billBtn, bill.status === "included" && s.billBtnGreen]}
                onPress={() => onCycleBill(bill.key, "included")}
                activeOpacity={0.8}
              >
                <Text style={[s.billBtnText, bill.status === "included" && s.billBtnTextGreen]}>
                  Incluido
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.billBtn, bill.status === "extra" && s.billBtnOrange]}
                onPress={() => onCycleBill(bill.key, "extra")}
                activeOpacity={0.8}
              >
                <Text style={[s.billBtnText, bill.status === "extra" && s.billBtnTextOrange]}>
                  +Extra
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.billBtn, bill.status === "not_included" && s.billBtnActive]}
                onPress={() => onCycleBill(bill.key, "not_included")}
                activeOpacity={0.8}
              >
                <Text style={[s.billBtnText, bill.status === "not_included" && s.billBtnTextActive]}>
                  —
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <Label>¿USÁIS LA APP PARA GASTOS?</Label>
      <View style={s.toggleList}>
        <ToggleRow emoji="🏠" label="Activar gestión de gastos compartidos" value={useExpensesApp} onChange={onUseExpensesAppChange} last />
      </View>
    </>
  );
}

// ─── Step 5 — Publicar ────────────────────────────────────────────────────────

function Step5({ title, price, location, roommates, checklist, publishActive, onPublishActiveChange }: any) {
  return (
    <>
      <Text style={s.stepTitle}>Listo para publicar</Text>
      <Text style={s.stepSubtitle}>Así verán tu anuncio los buscadores</Text>

      {/* Preview card */}
      <View style={s.previewCard}>
        <View style={s.previewImage}>
          <Ionicons name="bed-outline" size={36} color="#333" />
        </View>
        <View style={s.previewBody}>
          <View style={s.previewPriceRow}>
            <Text style={s.previewPrice}>€{price || "—"}</Text>
            <Text style={s.previewMes}>/mes</Text>
          </View>
          <Text style={s.previewTitle} numberOfLines={1}>{title || "Mi habitación"}</Text>
          {location && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
              <Text style={{ fontSize: 12 }}>📍</Text>
              <Text style={s.previewLocation} numberOfLines={1}>
                {[location.suburb, location.city].filter(Boolean).join(", ")}
                {roommates.length > 0 ? ` · ${roommates.length} conviviente${roommates.length > 1 ? "s" : ""}` : ""}
              </Text>
            </View>
          )}
          <View style={s.previewTags}>
            <Tag label="Baño privado" />
            <Tag label="Amueblada" />
            {roommates.length === 0 && <Tag label="Disponible ya" />}
          </View>
        </View>
      </View>

      {/* Checklist */}
      <Label>CHECKLIST</Label>
      <View style={s.checklistBox}>
        {(checklist as { label: string; ok: boolean; warn?: boolean }[]).map((item, i) => (
          <View key={i} style={s.checklistRow}>
            <View style={[s.checkIcon, item.warn ? s.checkIconWarn : item.ok ? s.checkIconOk : s.checkIconEmpty]}>
              <Ionicons
                name={item.warn ? "alert" : item.ok ? "checkmark" : "ellipse-outline"}
                size={12}
                color="#fff"
              />
            </View>
            <Text style={[s.checkLabel, item.warn && s.checkLabelWarn]}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Publish toggle */}
      <View style={s.toggleList}>
        <ToggleRow
          emoji="👁"
          label="Publicar como activo (visible ahora)"
          value={publishActive}
          onChange={onPublishActiveChange}
          last
        />
      </View>
    </>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function Label({ children }: { children: string }) {
  return <Text style={s.label}>{children}</Text>;
}

function Tag({ label }: { label: string }) {
  return (
    <View style={s.previewTag}>
      <Text style={s.previewTagText}>{label}</Text>
    </View>
  );
}

function ToggleRow({
  emoji, label, value, onChange, last,
}: {
  emoji: string; label: string; value: boolean; onChange: (v: boolean) => void; last?: boolean;
}) {
  return (
    <View style={[s.toggleRow, !last && s.toggleRowBorder]}>
      <Text style={s.toggleEmoji}>{emoji}</Text>
      <Text style={s.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#2A2A2A", true: "#F36A39" }}
        thumbColor="#fff"
        ios_backgroundColor="#2A2A2A"
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#111111" },
  safeTop: { backgroundColor: "#111111" },

  // Tabs
  tabsScroll: { paddingHorizontal: 12, gap: 8, paddingVertical: 10 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: "#1A1A1A", borderWidth: 1, borderColor: "#222",
  },
  tabActive: { backgroundColor: "#1E1E1E", borderColor: "#F36A39" },
  tabText: { fontSize: 13, fontWeight: "500", color: "#555" },
  tabTextActive: { color: "#fff", fontWeight: "600" },

  // Step header
  stepHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 6,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: "#1A1A1A",
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#222",
  },
  stepCounter: { fontSize: 14, fontWeight: "500", color: "#888" },

  // Progress bar
  progressBar: { flexDirection: "row", paddingHorizontal: 16, gap: 4, paddingBottom: 8 },
  progressSegment: { flex: 1, height: 3, borderRadius: 2, backgroundColor: "#222" },
  progressSegmentActive: { backgroundColor: "#F36A39" },

  // Content
  content: { flex: 1 },
  contentInner: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 },

  // Step titles
  stepTitle: { fontSize: 26, fontWeight: "800", color: "#fff", marginBottom: 6, lineHeight: 32 },
  stepSubtitle: { fontSize: 14, color: "#666", marginBottom: 24, lineHeight: 20 },
  label: { fontSize: 11, fontWeight: "600", color: "#555", letterSpacing: 1, marginTop: 24, marginBottom: 10 },

  // Input
  input: {
    height: 52, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, color: "#fff",
    backgroundColor: "#1A1A1A", borderWidth: 1, borderColor: "#2A2A2A",
  },
  priceWrap: { position: "relative" },
  priceEuro: { position: "absolute", left: 16, top: 16, fontSize: 16, color: "#fff", zIndex: 1 },
  priceInput: { paddingLeft: 30, paddingRight: 60 },
  priceSuffix: {
    position: "absolute", right: 16, top: 16, fontSize: 14, color: "#555",
  },

  // Bed type grid
  bedGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  bedOption: {
    width: "47%", aspectRatio: 1.6, borderRadius: 14, backgroundColor: "#1A1A1A",
    borderWidth: 1, borderColor: "#2A2A2A", alignItems: "center", justifyContent: "center", gap: 6,
  },
  bedOptionActive: { backgroundColor: "#2A1410", borderColor: "#F36A39" },
  bedEmoji: { fontSize: 22 },
  bedLabel: { fontSize: 14, fontWeight: "500", color: "#ccc" },
  bedLabelActive: { color: "#F36A39", fontWeight: "700" },

  // Toggles
  toggleList: {
    backgroundColor: "#1A1A1A", borderRadius: 14, borderWidth: 1, borderColor: "#222", overflow: "hidden",
  },
  toggleRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  toggleRowBorder: { borderBottomWidth: 1, borderBottomColor: "#222" },
  toggleEmoji: { fontSize: 18, width: 26 },
  toggleLabel: { flex: 1, fontSize: 15, color: "#ccc" },

  // Footer
  footer: { paddingHorizontal: 20, paddingBottom: 28, paddingTop: 8, backgroundColor: "#111111" },
  continueBtn: {
    height: 54, borderRadius: 14, backgroundColor: "#1A1A1A", borderWidth: 1, borderColor: "#2A2A2A",
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  continueBtnText: { fontSize: 17, fontWeight: "700", color: "#fff" },

  // Map
  mapBox: { height: 240, borderRadius: 16, marginBottom: 16, overflow: "hidden" },

  // Address card
  addressCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#1A1A1A",
    borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#222", gap: 12, marginBottom: 12,
  },
  addressCheck: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: "#15803D",
    alignItems: "center", justifyContent: "center",
  },
  addressMain: { fontSize: 14, fontWeight: "600", color: "#fff" },
  addressSub: { fontSize: 12, color: "#666", marginTop: 1 },
  editLink: { fontSize: 13, fontWeight: "600", color: "#F36A39" },
  addressCardEmpty: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#1A1A1A", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#222", marginBottom: 12,
  },
  addressEmptyText: { fontSize: 13, color: "#555" },

  // Info box
  infoBox: {
    flexDirection: "row", gap: 10, backgroundColor: "#1A1A1A",
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#222", marginTop: 4,
  },
  infoText: { flex: 1, fontSize: 13, color: "#666", lineHeight: 18 },

  // Household
  householdBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#1A1A1A", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#2A2A2A", marginBottom: 10,
  },
  householdIcon: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: "#F36A39",
    alignItems: "center", justifyContent: "center",
  },
  householdTitle: { fontSize: 14, fontWeight: "700", color: "#fff" },
  householdSub: { fontSize: 12, color: "#777", marginTop: 1 },
  importBtn: {
    backgroundColor: "#1A1A1A", borderRadius: 12, borderWidth: 1, borderColor: "#333",
    paddingVertical: 13, alignItems: "center", marginBottom: 4,
  },
  importBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },

  // Roommate list
  roommateList: {
    backgroundColor: "#1A1A1A", borderRadius: 14, borderWidth: 1, borderColor: "#222", overflow: "hidden",
  },
  roommateRow: {
    flexDirection: "row", alignItems: "center", padding: 14, gap: 12,
    borderBottomWidth: 1, borderBottomColor: "#222",
  },
  roommateAvatar: {
    width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center",
  },
  roommateInitial: { fontSize: 16, fontWeight: "700", color: "#fff" },
  roommateName: { fontSize: 14, fontWeight: "600", color: "#fff" },
  roommateUsername: { fontSize: 12, color: "#555", marginTop: 1 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  statusGreen: { backgroundColor: "rgba(21,128,61,0.15)", borderColor: "#15803D" },
  statusOrange: { backgroundColor: "rgba(243,106,57,0.15)", borderColor: "#F36A39" },
  statusText: { fontSize: 12, fontWeight: "600" },
  statusTextGreen: { color: "#4ADE80" },
  statusTextOrange: { color: "#F36A39" },
  addRoommateBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, padding: 14, borderStyle: "dashed", borderColor: "#333",
  },
  addRoommateBtnText: { fontSize: 14, color: "#555" },

  // Bills
  billList: {
    backgroundColor: "#1A1A1A", borderRadius: 14, borderWidth: 1, borderColor: "#222", overflow: "hidden",
  },
  billRow: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, gap: 12,
  },
  billRowBorder: { borderBottomWidth: 1, borderBottomColor: "#1E1E1E" },
  billEmoji: { fontSize: 18, width: 26 },
  billLabel: { flex: 1, fontSize: 15, color: "#ccc" },
  billActions: { flexDirection: "row", gap: 6 },
  billBtn: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    backgroundColor: "#222", borderWidth: 1, borderColor: "#2A2A2A",
  },
  billBtnGreen: { backgroundColor: "rgba(21,128,61,0.2)", borderColor: "#15803D" },
  billBtnOrange: { backgroundColor: "rgba(243,106,57,0.2)", borderColor: "#F36A39" },
  billBtnActive: { backgroundColor: "#2A2A2A", borderColor: "#444" },
  billBtnText: { fontSize: 12, fontWeight: "600", color: "#555" },
  billBtnTextGreen: { color: "#4ADE80" },
  billBtnTextOrange: { color: "#F36A39" },
  billBtnTextActive: { color: "#fff" },

  // Preview card
  previewCard: {
    backgroundColor: "#1A1A1A", borderRadius: 16, borderWidth: 1, borderColor: "#222", overflow: "hidden", marginBottom: 8,
  },
  previewImage: {
    height: 160, backgroundColor: "#1E1E1E", alignItems: "center", justifyContent: "center",
  },
  previewBody: { padding: 16 },
  previewPriceRow: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  previewPrice: { fontSize: 22, fontWeight: "800", color: "#F36A39" },
  previewMes: { fontSize: 13, color: "#666" },
  previewTitle: { fontSize: 16, fontWeight: "700", color: "#fff", marginTop: 2 },
  previewLocation: { fontSize: 13, color: "#666" },
  previewTags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  previewTag: {
    backgroundColor: "#222", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "#333",
  },
  previewTagText: { fontSize: 12, color: "#aaa" },

  // Checklist
  checklistBox: {
    backgroundColor: "#1A1A1A", borderRadius: 14, borderWidth: 1, borderColor: "#222",
    padding: 14, gap: 12, marginBottom: 8,
  },
  checklistRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  checkIcon: {
    width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center",
  },
  checkIconOk: { backgroundColor: "#15803D" },
  checkIconWarn: { backgroundColor: "#F36A39" },
  checkIconEmpty: { backgroundColor: "#2A2A2A" },
  checkLabel: { flex: 1, fontSize: 14, color: "#ccc" },
  checkLabelWarn: { color: "#F36A39" },
});
