"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Store,
    MapPin,
    Phone,
    Mail,
    Clock,
    Save,
    Loader2,
    Building2,
    ImageIcon,
    Upload,
    X,
    CheckCircle,
    AlertCircle,
    Globe,
    FileText,
    ArrowLeft,
    Truck,
    Navigation
} from "lucide-react";
import dynamic from "next/dynamic";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Leaflet reads `window` on import, so it cannot be server-rendered. Same
// dynamic import the add-shop form uses.
const MapPicker = dynamic(() => import("@/components/Maps/MapPicker"), {
    ssr: false,
    loading: () => (
        <div className="h-[300px] w-full bg-muted animate-pulse rounded-xl flex items-center justify-center text-muted-foreground">
            Loading Map...
        </div>
    ),
});

/**
 * The city out of a Nominatim address, which does not reliably have one.
 *
 * Checked against real Indian pincodes rather than assumed:
 *   110001 → `city: "New Delhi"`
 *   180001 → no `city` at all; `county: "Jammu"`
 *   400001 → no `city` and no `county`; `state_district: "Mumbai City District"`
 *
 * So `address.city` — what the detect-location path already read — is empty
 * for two of those three, and writing it straight into the form would blank a
 * city the owner had typed correctly. Hence a chain, widening from the exact
 * to the approximate, and `undefined` rather than `""` when nothing matches so
 * a caller can tell "not found" from "found nothing".
 *
 * `state_district` sits above `city_district` deliberately: for 400001 that is
 * "Mumbai City District" → "Mumbai City", where `city_district` is "Mumbai
 * Zone 2". Neither is the word "Mumbai"; the first is the one a human would
 * recognise.
 */
const cityFrom = (address = {}) => {
    const candidate =
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.county ||
        address.state_district ||
        address.city_district ||
        address.suburb;
    // "Jammu district" → "Jammu", "Mumbai City District" → "Mumbai City".
    return candidate ? candidate.replace(/\s+district$/i, "").trim() : undefined;
};

/** ["city", "state", "pincode"] → "city, state and pincode". */
const listOf = (items) =>
    items.length < 2
        ? items.join("")
        : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};

const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { 
        y: 0, 
        opacity: 1,
        transition: { type: "spring", stiffness: 300, damping: 25 }
    }
};

/**
 * Editing a shop's settings, for whoever is allowed to.
 *
 * Lifted out of the shop-owner route so an admin can edit any shop. The data
 * source is injected rather than read from the shop store, because the store
 * holds *the signed-in owner's* shops and an admin has none — but the form
 * still does the same `shops.find(s => s.id === shopId)` it always did, so the
 * loading logic is unchanged rather than rewritten.
 *
 * @param {string}   shopId
 * @param {any[]}    shops       the array to find the shop in
 * @param {boolean}  isLoading   whether that array is still being fetched
 * @param {Function} fetchShops  called once when the array is empty
 * @param {Function} saveShop    (shopId, FormData) => updated shop
 * @param {string}   backHref    where Cancel and a missing shop go
 */
export const EditShopForm = ({
    shopId,
    shops: myShops,
    isLoading: storeLoading,
    fetchShops: fetchMyShops,
    saveShop,
    backHref,
}) => {
    const router = useRouter();

    const [selectedShop, setSelectedShop] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [activeTab, setActiveTab] = useState("general");
    const [shopImage, setShopImage] = useState(null);
    const [pincodes, setPincodes] = useState([]);
    const [currentPincode, setCurrentPincode] = useState("");
    const [imagePreview, setImagePreview] = useState("");

    const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm();
    // The map is driven by the form values, not its own state, so typing a
    // coordinate moves the pin and dragging the pin fills the boxes.
    //
    // `useWatch`, not `watch()`: the latter returns a fresh function the React
    // Compiler cannot memoize, so it bails out of optimising the whole
    // component. This subscribes to the two fields and nothing else.
    const shopLat = useWatch({ control, name: "shop_lat" });
    const shopLng = useWatch({ control, name: "shop_lng" });
    const pincode = useWatch({ control, name: "pincode" });
    const [isDetecting, setIsDetecting] = useState(false);
    // Set when the form is seeded from the row, and compared against below so
    // loading a shop does not look like the owner editing its pincode. Without
    // it, simply opening the page would move the pin to the centre of the
    // area — overwriting a coordinate somebody had placed by hand.
    const seededPincodeRef = useRef(null);
    const [pinMovedFor, setPinMovedFor] = useState(null);

    useEffect(() => {
        if (myShops.length === 0) {
            fetchMyShops();
        }
    }, [fetchMyShops, myShops.length]);

    useEffect(() => {
        const shop = myShops.find(s => s.id === shopId);
        if (shop) {
            // Seeding local state from fetched data — the same pre-existing
            // pattern as the product edit form, exposed by moving this file out
            // of the eslint-exempt legacy tree so both routes could share it.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedShop(shop);
            reset({
                name: shop.name || "",
                description: shop.description || "",
                email: shop.email || "",
                phone: shop.phone || "",
                address_line: shop.address_line || "",
                city: shop.city || "",
                state: shop.state || "",
                pincode: shop.pincode || "",
                business_name: shop.business_name || "",
                opening_time: shop.opening_time || "09:00",
                closing_time: shop.closing_time || "21:00",
                website: shop.website || "",
                shop_lat: shop.shop_lat || "",
                shop_lng: shop.shop_lng || "",
                // The column is `preparation_time_min`; the form field is
                // `preparation_time`. Reading the form's name off the API row
                // meant this always fell through to 30, so a shop with a
                // 45-minute prep time opened its own edit page showing 30 —
                // and saving the form then wrote that 30 back.
                preparation_time: shop.preparation_time_min ?? 30,
                delivery_fee: shop.delivery_fee || 0,
                min_order_amount: shop.min_order_amount || 0,
                free_delivery_threshold: shop.free_delivery_threshold || 0,
            });
            seededPincodeRef.current = shop.pincode || "";
            setPincodes(shop.delivery_pincodes || []);
            setImagePreview(shop.image || "");
        } else if (!storeLoading && myShops.length > 0) {
            setErrorMessage("Shop not found.");
            setTimeout(() => router.push(backHref), 2000);
        }
    }, [shopId, myShops, reset, storeLoading, router]);

    const handleAddPincode = () => {
        if (!currentPincode) return;
        if (pincodes.includes(currentPincode)) {
             setErrorMessage("Pincode already added"); 
             return;
        }
        setPincodes([...pincodes, currentPincode]);
        setCurrentPincode("");
    };

    const handleRemovePincode = (code) => {
        setPincodes(pincodes.filter(p => p !== code));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setShopImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    /**
     * Move the pin when the owner changes the pincode.
     *
     * A pincode is the coarsest useful location there is — the answer is the
     * centre of a whole delivery area, not the shop — so this is a starting
     * point, never the final answer. It says so on screen, right where the pin
     * lands, because a pin that moves on its own and does not explain itself
     * is indistinguishable from one that moved by mistake.
     *
     * Three things stop it firing when it should not:
     *   - the seeded value, so opening the page is not read as an edit;
     *   - a 6-digit check, so it does not fire on every keystroke of one;
     *   - a debounce, because Nominatim asks for at most one request a second
     *     and typing a pincode is six changes in about that long.
     */
    useEffect(() => {
        const pin = String(pincode ?? "").trim();
        if (!/^\d{6}$/.test(pin)) return;
        // The shop's own pincode, as loaded. Changing it back to what it
        // always was is not a reason to move a pin that was already right.
        if (pin === seededPincodeRef.current) return;

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                // `addressdetails=1` so the same request that gives the
                // coordinates also gives the city and state — a second call
                // would be a second request against a geocoder that asks for
                // no more than one a second.
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&country=India&postalcode=${pin}&limit=1`,
                    { signal: controller.signal }
                );
                const results = await response.json();
                const hit = Array.isArray(results) ? results[0] : null;
                if (!hit) return;

                setValue("shop_lat", Number(hit.lat), { shouldDirty: true });
                setValue("shop_lng", Number(hit.lon), { shouldDirty: true });

                // Only what came back. A pincode the geocoder knows the state
                // for but not the city must not blank the city — the owner's
                // own answer is better than nothing, and this runs while they
                // are mid-edit.
                const city = cityFrom(hit.address);
                const state = hit.address?.state;
                if (city) setValue("city", city, { shouldDirty: true });
                if (state) setValue("state", state, { shouldDirty: true });

                setPinMovedFor({ source: "pincode", pincode: pin, filledAddress: Boolean(city || state) });
            } catch {
                // Aborted, offline, or the geocoder is down. The pin simply
                // stays where it was, which is the safe outcome — the owner
                // can still drag it or type the coordinates.
            }
        }, 700);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [pincode, setValue]);

    // The pending reverse-geocode for a pin move. Held in refs so a drag
    // followed by another drag cancels the first — Nominatim asks for no more
    // than one request a second, and a map is easy to click repeatedly.
    const reverseTimerRef = useRef(null);
    const reverseAbortRef = useRef(null);

    useEffect(
        () => () => {
            clearTimeout(reverseTimerRef.current);
            reverseAbortRef.current?.abort();
        },
        []
    );

    /**
     * The pin moved — by drag, by map click, or by the coordinate boxes.
     *
     * The address follows it: city, state and pincode are read back from the
     * new point. The street line is left alone; see `reverseGeocode`.
     */
    const setCoordinates = (lat, lng) => {
        setValue("shop_lat", lat, { shouldDirty: true });
        setValue("shop_lng", lng, { shouldDirty: true });
        // Placed by hand now, so the "this is only the area centre" notice has
        // stopped being true.
        setPinMovedFor(null);

        clearTimeout(reverseTimerRef.current);
        reverseAbortRef.current?.abort();
        const controller = new AbortController();
        reverseAbortRef.current = controller;

        reverseTimerRef.current = setTimeout(async () => {
            const filled = await reverseGeocode(lat, lng, {
                includeStreet: false,
                signal: controller.signal,
            });
            if (filled.length) setPinMovedFor({ source: "pin", filled });
        }, 600);
    };

    /**
     * Where the browser says the owner is, plus the address that goes with it.
     *
     * The address is only overwritten HERE, on an explicit press. Dragging the
     * pin moves the coordinates alone: on this form the address is already
     * filled in and usually correct — a shop's postal address and the point a
     * rider is sent to are not the same fact — so a nudge of the pin quietly
     * rewriting four typed fields would lose work the owner did not ask to
     * undo.
     */
    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            setErrorMessage("Geolocation is not supported by your browser.");
            return;
        }

        setIsDetecting(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setCoordinates(latitude, longitude);
                await reverseGeocode(latitude, longitude);
                setIsDetecting(false);
                setSuccessMessage("Location detected. Save to apply it.");
                setTimeout(() => setSuccessMessage(""), 3000);
            },
            () => {
                setIsDetecting(false);
                setErrorMessage("Could not detect your location. Enter it manually or move the pin.");
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    /**
     * Read the address at a point and write it into the form.
     *
     * @param {boolean} includeStreet whether to overwrite `address_line` too.
     *   False when the pin was moved: the street line is the one an owner
     *   writes by hand — "Shop 4, opposite the temple" — and a geocoded road
     *   name is usually worse than what is already there. True for "Use my
     *   current location", which is an explicit "set all of this from where I
     *   am".
     * @returns {Promise<string[]>} the fields actually written, so the caller
     *   can say what changed instead of guessing.
     */
    const reverseGeocode = async (lat, lng, { includeStreet = true, signal } = {}) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                { signal }
            );
            const data = await response.json();
            if (!data.address) return [];

            const { road, suburb, neighbourhood, state, postcode } = data.address;
            const line = [road, neighbourhood, suburb].filter(Boolean).join(", ");
            const city = cityFrom(data.address);
            const filled = [];

            // Each guarded. This used to write `city || town || village || ""`
            // and the same for state and pincode, so a point the geocoder knew
            // little about cleared three fields the owner had filled in
            // correctly — an "autofill" that deleted.
            if (includeStreet && line) {
                setValue("address_line", line, { shouldDirty: true });
                filled.push("street");
            }
            if (city) {
                setValue("city", city, { shouldDirty: true });
                filled.push("city");
            }
            if (state) {
                setValue("state", state, { shouldDirty: true });
                filled.push("state");
            }
            if (postcode) {
                // Recorded as already-in-sync BEFORE the write.
                //
                // Otherwise this is a loop: the pin sets the pincode, the
                // pincode effect sees a new value and geocodes it, and the pin
                // jumps from the exact spot the owner just dropped it on to
                // the centre of the postal area. The two features would fight
                // every time, and the owner would lose.
                seededPincodeRef.current = postcode;
                setValue("pincode", postcode, { shouldDirty: true });
                filled.push("pincode");
            }
            return filled;
        } catch {
            // Best effort. The coordinates are the part that matters and they
            // are already set; a geocoder being down must not lose them.
            return [];
        }
    };

    const onSubmit = async (data) => {
        setIsSaving(true);
        setSuccessMessage("");
        setErrorMessage("");

        try {
            const formData = new FormData();
            if (shopImage) {
                formData.append('image', shopImage);
            }
            
            // Explicitly cast numbers and append others
            Object.keys(data).forEach(key => {
                if (key === 'shop_lat' || key === 'shop_lng') {
                    // Skipped when blank rather than sent as `Number("")`,
                    // which is 0 — and 0,0 is a real place in the Gulf of
                    // Guinea. An empty box means "leave it alone", not "move
                    // the shop to the Atlantic".
                    const n = Number(data[key]);
                    if (data[key] !== "" && data[key] !== null && Number.isFinite(n)) {
                        formData.set(key, n);
                    }
                } else if (key === 'delivery_fee' || key === 'min_order_amount' || key === 'free_delivery_threshold' || key === 'preparation_time') {
                    formData.set(key, Number(data[key]));
                } else if (data[key] !== null && data[key] !== undefined) {
                    formData.set(key, data[key]);
                }
            });

            // Send pincodes as JSON string to ensure array structure is preserved
            formData.set('delivery_pincodes', JSON.stringify(pincodes));

            const updated = await saveShop(shopId, formData);

            if (updated) {
                setSuccessMessage("Shop details updated successfully!");
                setTimeout(() => setSuccessMessage(""), 3000);
            } else {
                throw new Error("Update failed");
            }
        } catch (error) {
            setErrorMessage(error.message || "Failed to update shop details.");
        } finally {
            setIsSaving(false);
        }
    };

    if (storeLoading && !selectedShop) {
        return (
            <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[50vh]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground animate-pulse">Fetching shop details...</p>
            </div>
        );
    }

    if (!selectedShop && !storeLoading) {
        return <div className="p-10 text-center text-muted-foreground">Shop not found.</div>;
    }

    return (
        <motion.div 
            className="container mx-auto p-6 space-y-6 max-w-5xl"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header Section */}
            <motion.div 
                variants={itemVariants}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
                <div className="flex items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push(backHref)}
                        className="p-2 rounded-xl bg-muted hover:bg-accent transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                    </motion.button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 text-foreground">
                            <div className="p-2 rounded-xl bg-primary shadow-lg shadow-primary/25">
                                <Store className="h-5 w-5 text-primary-foreground" />
                            </div>
                            Edit Shop: {selectedShop.name}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">Manage your business profile and availability</p>
                    </div>
                </div>
                {/* `shop_status`, not `status`. The column has never been
                    called `status`, so both reads here were `undefined` — and
                    because each fell back to "active", a shop waiting for
                    approval told its owner it was live. The same field drift
                    as `main_image` / `main_image_url`, and with the same
                    signature: no error, just a confident wrong answer.

                    No fallback now either. `shop_status` is NOT NULL, so a
                    missing value means the shop was not loaded — and printing
                    "ACTIVE" for that is how this got here. */}
                <Badge
                    className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                        selectedShop.shop_status === 'active'
                            ? 'bg-success/15 text-success'
                            : selectedShop.shop_status === 'pending'
                            ? 'bg-warning/15 text-warning'
                            : 'bg-muted text-muted-foreground'
                    }`}
                >
                    {selectedShop.shop_status === 'pending'
                        ? 'AWAITING APPROVAL'
                        : selectedShop.shop_status?.toUpperCase() ?? '—'}
                </Badge>
            </motion.div>

            {/* Notifications */}
            {successMessage && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-success/10 border border-success/30 text-success px-4 py-3 rounded-xl flex items-center gap-2"
                >
                    <CheckCircle className="h-5 w-5" /> {successMessage}
                </motion.div>
            )}
            {errorMessage && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-xl flex items-center gap-2"
                >
                    <AlertCircle className="h-5 w-5" /> {errorMessage}
                </motion.div>
            )}

            <motion.div variants={itemVariants}>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    {/* Custom Animated Tab List */}
                    <div className="bg-muted p-1.5 rounded-2xl">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 relative">
                            {[
                                { id: "general", label: "General", icon: Store },
                                { id: "contact", label: "Contact", icon: Phone },
                                { id: "business", label: "Business", icon: Building2 },
                                { id: "hours", label: "Hours", icon: Clock },
                                { id: "delivery", label: "Delivery", icon: Truck },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative z-10 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-xl transition-colors duration-200 ${
                                        activeTab === tab.id
                                            ? "text-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="active-tab-pill"
                                            className="absolute inset-0 bg-background rounded-xl shadow-sm"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2">
                                        <tab.icon className="h-4 w-4" />
                                        {tab.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <TabsContent value="general" className="space-y-6 outline-none">
                        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Store className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>
                                    <p className="text-sm text-muted-foreground">Update your shop&apos;s display details and branding</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-sm font-medium text-foreground">Shop Brand Image</label>
                                    <div className="flex items-center gap-6">
                                        <div className="relative group">
                                            {imagePreview ? (
                                                <div className="relative">
                                                    <img src={imagePreview} alt="Shop Preview" className="h-28 w-28 rounded-2xl object-cover border-2 border-border" />
                                                    <button
                                                        type="button"
                                                        onClick={() => { setImagePreview(""); setShopImage(null); }}
                                                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow-sm hover:scale-110 transition-transform"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="h-28 w-28 rounded-2xl bg-muted flex flex-col items-center justify-center border-2 border-dashed border-border">
                                                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <input type="file" id="shop-image" accept="image/*" onChange={handleImageChange} className="hidden" />
                                            <label htmlFor="shop-image">
                                                <Button type="button" variant="outline" size="sm" asChild className="rounded-xl">
                                                    <span className="cursor-pointer"><Upload className="h-4 w-4 mr-2" /> Change Image</span>
                                                </Button>
                                            </label>
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">JPG, PNG or WEBP. Max 2MB.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Shop Name</label>
                                        <Input 
                                            {...register("name", { required: "Shop name is required" })} 
                                            placeholder="Enter shop name"
                                            className="rounded-xl bg-muted/50"
                                        />
                                        {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Description</label>
                                        <Textarea 
                                            {...register("description")} 
                                            rows={4} 
                                            placeholder="Tell customers about your shop..."
                                            className="rounded-xl bg-muted/50"
                                        />
                                    </div>

                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="contact" className="space-y-6 outline-none">
                        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <MapPin className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">Contact & Location</h2>
                                    <p className="text-sm text-muted-foreground">How customers can reach you and find your store</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" /> Email Address
                                        </label>
                                        <Input 
                                            type="email" 
                                            {...register("email")} 
                                            placeholder="business@example.com"
                                            className="rounded-xl bg-muted/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-muted-foreground" /> Phone Number
                                        </label>
                                        <Input 
                                            {...register("phone")} 
                                            placeholder="+1 234 567 890"
                                            className="rounded-xl bg-muted/50"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground" /> Street Address
                                    </label>
                                    <Textarea 
                                        {...register("address_line")} 
                                        rows={2} 
                                        placeholder="Building, Street, Area"
                                        className="rounded-xl bg-muted/50"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">City</label>
                                        <Input 
                                            {...register("city")} 
                                            placeholder="City"
                                            className="rounded-xl bg-muted/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">State</label>
                                        <Input 
                                            {...register("state")} 
                                            placeholder="State"
                                            className="rounded-xl bg-muted/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Pincode</label>
                                        <Input 
                                            {...register("pincode")} 
                                            placeholder="Zip Code"
                                            className="rounded-xl bg-muted/50"
                                        />
                                    </div>
                                </div>

                                {/* The map pin.
                                
                                    The add-shop form has always asked for this
                                    — coordinates are required to create a shop
                                    — and the edit form had no way to change
                                    it. It seeded the values into form state
                                    and posted them back untouched, so a shop
                                    that moved kept sending riders to the old
                                    address forever, with no field anywhere
                                    saying why.
                                    
                                    The address above and the pin here are two
                                    different facts: one is what a customer
                                    reads, the other is where a rider is sent.
                                    An owner editing one usually means to edit
                                    the other, so they sit together. */}
                                <div className="pt-2 space-y-4 border-t border-border">
                                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
                                        <div>
                                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                                <Navigation className="h-4 w-4 text-muted-foreground" /> Map location
                                            </label>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Where delivery riders are sent. Drag the pin or type the coordinates.
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleDetectLocation}
                                            disabled={isDetecting}
                                            className="rounded-xl"
                                        >
                                            {isDetecting ? (
                                                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                                            ) : (
                                                <Navigation className="h-4 w-4 mr-1.5" />
                                            )}
                                            {isDetecting ? "Detecting..." : "Use my current location"}
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label htmlFor="shop_lat" className="text-sm font-medium text-foreground">Latitude</label>
                                            <Input
                                                id="shop_lat"
                                                type="number"
                                                step="any"
                                                {...register("shop_lat")}
                                                placeholder="0.000000"
                                                className="rounded-xl bg-muted/50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="shop_lng" className="text-sm font-medium text-foreground">Longitude</label>
                                            <Input
                                                id="shop_lng"
                                                type="number"
                                                step="any"
                                                {...register("shop_lng")}
                                                placeholder="0.000000"
                                                className="rounded-xl bg-muted/50"
                                            />
                                        </div>
                                    </div>

                                    {/* Says what just happened and that it is not
                                        finished. A pincode resolves to the centre of a
                                        whole area, so the pin is in the right
                                        neighbourhood and the wrong street — and an owner
                                        who does not know that will save it as-is. */}
                                    {pinMovedFor && (
                                        <p className="flex items-start gap-2 rounded-xl border border-warning/25 bg-warning/5 p-3 text-xs text-muted-foreground">
                                            <Navigation className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                                            <span>
                                                {/* One interpolated string, not text
                                                    either side of `{pinMovedFor}` — JSX splits
                                                    that into three text nodes, and a reader
                                                    (or a test) looking for the whole sentence
                                                    finds none of it. */}
                                                {/* Named rather than left to be noticed: several
                                                    fields changing at once from one edit is
                                                    surprising, and the city in particular can
                                                    be a district name rather than the one
                                                    locals use.
                                                    
                                                    Two directions, two messages. Typing a
                                                    pincode gives an area centre and the pin
                                                    still needs placing; moving the pin gives an
                                                    exact point and it is the address that needs
                                                    checking. */}
                                                {pinMovedFor.source === "pin" ? (
                                                    <>
                                                        <span className="font-medium text-foreground">
                                                            {`Updated from the pin: ${listOf(pinMovedFor.filled)}.`}
                                                        </span>{" "}
                                                        Check them before saving.
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="font-medium text-foreground">
                                                            {pinMovedFor.filledAddress
                                                                ? `Pin, city and state set from ${pinMovedFor.pincode}.`
                                                                : `Pin moved to the centre of ${pinMovedFor.pincode}.`}
                                                        </span>{" "}
                                                        The pin is the middle of the area, not your door — drag it to
                                                        where the shop actually is
                                                        {pinMovedFor.filledAddress ? ", and check the city and state." : "."}
                                                    </>
                                                )}
                                            </span>
                                        </p>
                                    )}

                                    {/* Moving the pin writes the two boxes above and
                                        nothing else — see `handleDetectLocation` for why
                                        the address is left alone. */}
                                    <MapPicker
                                        lat={Number(shopLat) || null}
                                        lng={Number(shopLng) || null}
                                        onLocationChange={setCoordinates}
                                    />
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="business" className="space-y-6 outline-none">
                        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Building2 className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">Business Registration</h2>
                                    <p className="text-sm text-muted-foreground">Official business details and web presence</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" /> Official Business Name
                                    </label>
                                    <Input 
                                        {...register("business_name")} 
                                        placeholder="e.g. Fresh Mart Private Ltd"
                                        className="rounded-xl bg-muted/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-muted-foreground" /> Website URL
                                    </label>
                                    <Input 
                                        {...register("website")} 
                                        placeholder="https://www.yourshop.com"
                                        className="rounded-xl bg-muted/50"
                                    />
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="hours" className="space-y-6 outline-none">
                        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Clock className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">Operating Hours</h2>
                                    <p className="text-sm text-muted-foreground">Set your shop&apos;s opening and closing times</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" /> Opening Time
                                    </label>
                                    <Input 
                                        type="time" 
                                        {...register("opening_time")} 
                                        className="rounded-xl bg-muted/50 cursor-pointer"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" /> Closing Time
                                    </label>
                                    <Input 
                                        type="time" 
                                        {...register("closing_time")} 
                                        className="rounded-xl bg-muted/50 cursor-pointer"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-dashed border-border text-center">
                                <p className="text-xs text-muted-foreground">Times are based on your local timezone.</p>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="delivery" className="space-y-6 outline-none">
                        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Truck className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">Delivery Settings</h2>
                                    <p className="text-sm text-muted-foreground">Manage delivery areas and fees</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="text-sm font-medium text-foreground">Delivery Pincodes</label>
                                    <div className="flex gap-2">
                                        <Input 
                                            value={currentPincode}
                                            onChange={(e) => setCurrentPincode(e.target.value)}
                                            placeholder="Enter pincode"
                                            className="rounded-xl bg-muted/50"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddPincode();
                                                }
                                            }}
                                        />
                                        <Button 
                                            type="button"
                                            onClick={handleAddPincode}
                                            className="rounded-xl"
                                        >
                                            Add
                                        </Button>
                                    </div>
                                    
                                    {pincodes.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {pincodes.map((pin, index) => (
                                                <div key={index} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm border border-primary/20">
                                                    <span>{pin}</span>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleRemovePincode(pin)}
                                                        className="hover:text-destructive ml-1"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground italic">No delivery pincodes added yet.</p>
                                    )}
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Delivery Fee</label>
                                        <Input 
                                            type="number"
                                            {...register("delivery_fee")} 
                                            className="rounded-xl bg-muted/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Min Order Amount</label>
                                        <Input 
                                            type="number"
                                            {...register("min_order_amount")} 
                                            className="rounded-xl bg-muted/50"
                                        />
                                    </div>
                                     <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Free Delivery Threshold</label>
                                        <Input 
                                            type="number"
                                            {...register("free_delivery_threshold")} 
                                            className="rounded-xl bg-muted/50"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-border">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => router.push(backHref)} 
                            disabled={isSaving}
                            className="rounded-xl"
                        >
                            Discard Changes
                        </Button>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button 
                                onClick={handleSubmit(onSubmit)} 
                                disabled={isSaving} 
                                className="min-w-[150px] rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                            >
                                {isSaving ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
                                ) : (
                                    <><Save className="mr-2 h-4 w-4" /> Save All Changes</>
                                )}
                            </Button>
                        </motion.div>
                    </div>
                </Tabs>
            </motion.div>

            {/* Stats Summary */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: "Inventory", value: selectedShop.total_products || 0, tone: "text-primary", bg: "bg-primary/10" },
                    { label: "Total Sales", value: selectedShop.total_orders || 0, tone: "text-success", bg: "bg-success/10" },
                    {
                        label: "Account Status",
                        value:
                            selectedShop.shop_status === 'pending'
                                ? 'Awaiting approval'
                                : selectedShop.shop_status ?? '—',
                        tone: "text-foreground",
                        bg: "bg-muted",
                    }
                ].map((stat, i) => (
                    <motion.div 
                        key={i} 
                        whileHover={{ y: -4 }}
                        className={`${stat.bg} rounded-2xl p-5 border border-transparent`}
                    >
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
                        <p className={`text-2xl font-bold capitalize ${stat.tone}`}>{stat.value}</p>
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>
    );
};
