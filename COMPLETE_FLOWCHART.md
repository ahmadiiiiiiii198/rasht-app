# EFES APP - COMPLETE FLOWCHART & ARCHITECTURE

## MAIN FLOW: Product Selection → Cart → Checkout

```
┌─────────────────────────────────────────────────────────────────┐
│                         APP.TSX (Root)                          │
│              Circular Navigation Menu (Framer Motion)           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    Click "Menu"
                         │
                         ↓
                   ┌──────────────┐
                   │  MenuPage    │
                   └──────┬───────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ↓                 ↓                 ↓
   Load Products    Load Categories   Display Accordion
   (Supabase)       (Supabase)        (Categories)
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                    User Expands Category
                          │
                          ↓
                   Display Products
                   (Name, Price, Image)
                          │
                    User Clicks + Button
                          │
                          ↓
                   handleProductClick()
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ↓                 ↓                 ↓
   Load Extras    Load Beverages    Open Modal
   (Supabase)     (Supabase)        (Customization)
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                    Modal Shows:
                    ├─ Product Info
                    ├─ Quantity Selector
                    ├─ Extras (if enabled)
                    ├─ Beverages (always)
                    ├─ Special Requests
                    └─ Total Price
                          │
                    User Selects:
                    ├─ Quantity
                    ├─ Extras
                    ├─ Beverages
                    └─ Special Requests
                          │
                    User Clicks "Add to Cart"
                          │
                          ↓
                   handleAddToCart()
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ↓                 ↓                 ↓
   Save to          Dispatch Event    Close Modal
   localStorage     'cartUpdated'     (Return to Menu)
   'efes_cart'             │
        │                  │
        └──────────────────┼──────────────────┐
                           │                  │
                    CartPage Hook Listens     │
                    (useCart)                 │
                           │                  │
                           ↓                  ↓
                    Reload from          User Clicks
                    localStorage         "View Cart"
                           │                  │
                           └──────────────────┘
                                  │
                                  ↓
                            ┌──────────────┐
                            │  CartPage    │
                            └──────┬───────┘
                                   │
                    ┌──────────────┬┴──────────────┐
                    │              │               │
                    ↓              ↓               ↓
              Display Items   Show Summary   Action Buttons
              ├─ Product      ├─ Subtotal    ├─ Clear Cart
              ├─ Extras       ├─ Delivery    └─ Checkout
              ├─ Beverages    └─ Total
              ├─ Qty Controls
              └─ Delete Btn
                    │
                    └─→ User Clicks "Checkout"
                           │
                           ↓
                    Show Checkout Form
                    ├─ Name Input
                    ├─ Email Input
                    ├─ Phone Input
                    └─ Address Input
                           │
                    User Fills Form & Clicks "Place Order"
                           │
                           ↓
                    handleCheckout()
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ↓                  ↓                  ↓
   Validate Info   Create Order       Clear Cart
   (All fields)    (Supabase)         (localStorage)
                   ├─ Insert Order
                   └─ Insert Items
                           │
                           ↓
                    Show Success Message
```

---

## STATE MANAGEMENT

```
MenuPage State:
├─ expandedCategories: Set<string>
├─ products: Product[]
├─ categories: Category[]
├─ selectedProduct: Product | null
├─ quantity: number
├─ selectedExtras: SelectedExtra[]
├─ selectedBeverages: SelectedExtra[]
├─ specialRequests: string
└─ showCustomizationModal: boolean

CartPage State:
├─ showCheckout: boolean
├─ customerInfo: {name, email, phone, address}
└─ isSubmitting: boolean

useCart Hook State:
└─ items: CartItem[] (from localStorage)

Data Sources:
├─ Supabase: products, categories, extras, beverages
├─ localStorage: cart items (efes_cart)
└─ Custom Events: cartUpdated
```

---

## DATA PERSISTENCE FLOW

```
MenuPage
  │
  ├─ User adds product
  │  └─ handleAddToCart()
  │     └─ localStorage.setItem('efes_cart', {...})
  │        └─ window.dispatchEvent('cartUpdated')
  │
  └─ localStorage 'efes_cart'
     │
     ├─ Event: 'cartUpdated' fired
     │  └─ CartPage useCart hook listens
     │     └─ loadCart() called
     │        └─ setItems() → Re-render CartPage
     │
     └─ Direct read on CartPage mount
        └─ useCart hook loads from localStorage
           └─ Displays items in cart
```

---

## COMPONENT HIERARCHY

```
App.tsx
├─ HomePage
├─ ContattiPage
├─ MenuPage ← MAIN FOCUS
│  ├─ Uses: getProducts(), getCategories()
│  ├─ Reads: localStorage 'efes_cart'
│  ├─ Writes: localStorage 'efes_cart'
│  └─ Emits: 'cartUpdated' event
│
├─ CartPage ← MAIN FOCUS
│  ├─ Uses: useCart() hook
│  ├─ Uses: createOrder()
│  ├─ Reads: localStorage 'efes_cart' (via hook)
│  ├─ Writes: localStorage 'efes_cart' (via hook)
│  └─ Listens: 'cartUpdated' event
│
├─ OrdersPage
├─ ProfilePage
├─ OffersPage
└─ LoyaltyPage
```

---

## CURRENT ISSUES & ROOT CAUSES

```
ISSUE 1: Products Not Visible
├─ Symptom: Categories expand but products don't show
├─ Root Cause: CSS overflow: hidden on animation container (line 414)
├─ Location: MenuPage.tsx
├─ Status: Products in DOM (160 elements) but not rendered
└─ Fix Needed: Check CSS styling

ISSUE 2: Modal Not Opening
├─ Symptom: Can't click products to open modal
├─ Root Cause: Products not visible → can't click them
├─ Location: MenuPage.tsx product rendering
├─ Dependency: Issue 1 must be fixed first
└─ Fix Needed: Fix product visibility

ISSUE 3: Cart Not Updating
├─ Symptom: Items not appearing in CartPage
├─ Root Cause: handleAddToCart never called (products not clickable)
├─ Location: MenuPage.tsx handleAddToCart()
├─ Dependency: Issue 2 must be fixed first
└─ Fix Needed: Fix modal opening

ISSUE 4: Event Not Firing
├─ Symptom: CartPage doesn't reload when items added
├─ Root Cause: handleAddToCart not called → no event dispatched
├─ Location: MenuPage.tsx line 317
├─ Dependency: Issue 3 must be fixed first
└─ Fix Needed: Ensure event is dispatched
```

---

## FUNCTION CALL CHAIN

```
User Action → Function → Sub-functions → Data Persistence

1. User clicks + button on product
   └─ handleProductClick(product)
      ├─ setSelectedProduct(product)
      ├─ setShowCustomizationModal(true)
      ├─ loadExtrasAndBeverages()
      │  ├─ Query extras from Supabase
      │  └─ Query beverages from Supabase
      └─ checkCategoryExtrasSupport()
         └─ Query category.extras_enabled from Supabase

2. User clicks "Add to Cart" in modal
   └─ handleAddToCart()
      ├─ Read localStorage 'efes_cart'
      ├─ Add/update item with:
      │  ├─ id, name, price, quantity
      │  ├─ image_url
      │  ├─ extras[]
      │  ├─ beverages[]
      │  └─ specialRequests
      ├─ Write to localStorage 'efes_cart'
      ├─ Dispatch 'cartUpdated' event
      └─ Close modal

3. CartPage useCart hook receives event
   └─ Event listener: 'cartUpdated'
      └─ loadCart()
         ├─ Read localStorage 'efes_cart'
         └─ setItems() → Re-render CartPage

4. User clicks "Place Order"
   └─ handleCheckout()
      ├─ Validate customer info
      ├─ createOrder()
      │  ├─ Insert into orders table
      │  └─ Insert into order_items table
      ├─ Clear cart
      │  ├─ setItems([])
      │  └─ localStorage.removeItem('efes_cart')
      └─ Show success message
```

---

## KEY INTERFACES & TYPES

```
Product:
├─ id: string
├─ name: string
├─ price: number
├─ image_url: string
├─ description: string
├─ category_id: string
└─ is_active: boolean

Category:
├─ id: string
├─ name: string
├─ extras_enabled: boolean
└─ is_active: boolean

CartItem:
├─ id: string
├─ name: string
├─ price: number
├─ quantity: number
├─ image_url: string
├─ extras: Extra[]
├─ beverages: Extra[]
└─ specialRequests: string

Extra:
├─ id: string
├─ name: string
├─ price: number
└─ quantity: number

Order:
├─ id: string
├─ order_number: string
├─ customer_name: string
├─ customer_email: string
├─ total_amount: number
└─ status: string
```

---

## SUMMARY

**Main Issue**: Products not visible in expanded categories
**Root Cause**: CSS rendering issue (likely overflow: hidden)
**Impact**: Blocks entire flow (can't select products → can't add to cart)
**Fix Priority**: HIGH - Must fix before testing cart functionality
