# Menu Page Implementation Analysis (Concept A: Vertical Gallery)

## 1. Current State vs. Required Architecture

| Feature | Current Code (`MenuPage.tsx`) | Required for Concept A |
| :--- | :--- | :--- |
| **Scroll Model** | Single scrollable list (`div`) with a large top spacer (`paddingTop: 42vh`). | **Snap Container**: A container with `scroll-snap-type: y mandatory` and `height: 100vh`. |
| **Item Sizing** | List items are relatively small cards within the flow. | **Full Screen Items**: Each `.product-item` must be `height: 100vh`. |
| **Image Handling** | One *global* fixed image at the top that changes based on `IntersectionObserver`. | **Per-Slide Image**: Each slide contains its own image (or a tightly synced animation) to ensure 1:1 mapping. |
| **Z-Index Layering** | Hero Image (0) < List Content (10) < Header (100). | Background (0) < Pizza Image (10) < Content Sheet (20) < Header (100). |

## 2. Global Constraints Checklist (`App.tsx` & `App.css`)
- **Container padding**: `App.tsx` renders `MenuPage` inside a `.page-content` div.
    - *Issue*: `.page-content` has default padding (`var(--page-padding)`).
    - *Fix*: `App.tsx` line 279 checks `activeButton === 'menu'` to add `.no-padding`. **This is already set up correctly.** ✅
- **Navigation**: The circular nav is managed in `App.tsx`.
    - *Constraint*: The Menu Page must handle its own internal back/close actions if needed, though `App.tsx` provides a generic back arrow.
- **Theme Variables**: `App.css` defines `--persian-gold`, `--persian-emerald`, etc. We have full access to these.

## 3. Detailed Component Breakdown (For Implementation)

### A. The Container (`.rashti-page-dark`)
*   **Current**: Has `position: relative`, `overflow: hidden`.
*   **Change Needed**: Needs to become the scroll root.
    ```css
    height: 100vh;
    overflow-y: scroll;
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
    ```

### B. The Full-Screen Slide (New Component)
We need to replace the `.filteredProducts.map(...)` list with a Full-Page Component loop.
Each Slide will have:
1.  **Top Visual Area (55%)**:
    *   Flex container, centered.
    *   `img` tag for the Pizza.
    *   *Motion*: `initial={{ scale: 0.8 }} whileInView={{ scale: 1 }}`.
2.  **Bottom Content Sheet (45%)**:
    *   `background: rgba(...)` (Glassmorphism).
    *   `border-top-radius: 30px`.
    *   **Flex Column** layout:
        *   Cat Badge + Rating (Top)
        *   Title + Jersey + Desc (Middle, flex-grow)
        *   Price + Add Button (Bottom, fixed)

### C. Logic Refactoring
*   **Active Product Detection**:
    *   *Current*: Complex `IntersectionObserver` on list items.
    *   *New*: Simpler `IntersectionObserver` with threshold `0.5` targeting the *entire slide*. This ensures the "Active" state snaps perfectly when the user swipes.
*   **Asset Helper**: `getPizzaImage` helper function is robust and can be reused as-is. ✅
*   **Filtering**: The `filteredProducts` logic (Search/Category) works well. The *only* change is that if text search is used, the "Slides" simply reduce in number. The active slide logic handles this naturally.

## 4. Code Migration Plan (Line-by-Line Strategy)
1.  **Keep**: Assets helper (`lines 13-30`), Data Loading (`lines 50-87`), Cart Logic (`lines 131-140`).
2.  **Delete**: The "Fixed Top Image" div (`lines 153-192`). It is no longer "Fixed global", it becomes "Local to slide".
3.  **Modify**: The "Scrollable List" div (`line 246`) changes from `position: absolute` with padding to a standard block-flow container that holds the 100vh slides.
4.  **Refactor**: The Card inner HTML (`lines 280-360`) needs to be expanded from a "Card" to a "Full Screen Layout".

## 5. Risk Assessment
*   **Mobile Browser Bars**: On mobile Safari/Chrome, `100vh` can be jumpy due to the URL bar.
    *   *Mitigation*: Use `dvh` (Dynamic Viewport Height) units if supported, or stick to `height: 100%` on the fixed container.
*   **Performance**: Rendering 50 heavy images in a vertical list.
    *   *Mitigation*: The browser handles off-screen image decoding well, but adding `loading="lazy"` to images below the fold is critical.

## 6. Conclusion
The codebase is ready for this change. The `App.tsx` container logic already supports full-bleed pages (`no-padding` class). The data structures in `MenuPage.tsx` are solid. The primary work is strictly **markup and CSS refactoring** within the `MenuPage` render function.

**Ready to start coding upon approval.**
