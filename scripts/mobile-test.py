#!/usr/bin/env python3
"""
Mobile Responsiveness Testing Script

Tests landing page and dashboard at mobile viewport sizes.
Captures screenshots and identifies layout issues.
"""

from playwright.sync_api import sync_playwright
import os

# Mobile viewport configurations
VIEWPORTS = {
    'mobile_small': {'width': 320, 'height': 568},   # iPhone SE
    'mobile': {'width': 375, 'height': 667},          # iPhone 8
    'mobile_large': {'width': 414, 'height': 896},    # iPhone 11 Pro Max
    'tablet': {'width': 768, 'height': 1024},         # iPad
}

OUTPUT_DIR = '/tmp/mobile-screenshots'

def ensure_output_dir():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Screenshots will be saved to: {OUTPUT_DIR}")

def test_landing_page(page, viewport_name, viewport):
    """Test landing page mobile responsiveness"""
    page.set_viewport_size(viewport)
    page.goto('http://localhost:3000', wait_until='networkidle')
    page.wait_for_timeout(1000)  # Wait for animations

    # Full page screenshot
    screenshot_path = f"{OUTPUT_DIR}/landing_{viewport_name}.png"
    page.screenshot(path=screenshot_path, full_page=True)
    print(f"  Saved: {screenshot_path}")

    # Check for horizontal overflow
    body_width = page.evaluate("document.body.scrollWidth")
    viewport_width = viewport['width']
    if body_width > viewport_width:
        print(f"  WARNING: Horizontal overflow detected! Body: {body_width}px, Viewport: {viewport_width}px")

    # Check mobile menu visibility
    mobile_menu_btn = page.locator('button[aria-label="Open menu"], button:has(svg.lucide-menu)')
    if mobile_menu_btn.count() > 0:
        is_visible = mobile_menu_btn.first.is_visible()
        print(f"  Mobile menu button visible: {is_visible}")
    else:
        print(f"  WARNING: No mobile menu button found")

    # Check if hero section elements are visible
    hero_heading = page.locator('h1').first
    if hero_heading.is_visible():
        hero_box = hero_heading.bounding_box()
        if hero_box:
            print(f"  Hero heading position: x={hero_box['x']:.0f}, width={hero_box['width']:.0f}")
            if hero_box['x'] < 0 or hero_box['x'] + hero_box['width'] > viewport_width + 10:
                print(f"  WARNING: Hero heading may be cut off")

def test_dashboard(page, viewport_name, viewport):
    """Test dashboard mobile responsiveness (requires auth bypass or screenshot of login)"""
    page.set_viewport_size(viewport)
    page.goto('http://localhost:3000/dashboard', wait_until='networkidle')
    page.wait_for_timeout(1000)

    # This will likely redirect to login - capture that state
    current_url = page.url
    screenshot_path = f"{OUTPUT_DIR}/dashboard_{viewport_name}.png"
    page.screenshot(path=screenshot_path, full_page=True)
    print(f"  Saved: {screenshot_path}")

    if '/login' in current_url:
        print(f"  Redirected to login (expected for unauthenticated)")
        # Test login page mobile
        test_login_page(page, viewport_name, viewport)

def test_login_page(page, viewport_name, viewport):
    """Test login page mobile responsiveness"""
    page.set_viewport_size(viewport)

    # Check form is visible and properly sized
    form = page.locator('form').first
    if form.is_visible():
        form_box = form.bounding_box()
        if form_box:
            print(f"  Login form width: {form_box['width']:.0f}px")
            if form_box['width'] > viewport['width'] - 20:
                print(f"  WARNING: Login form may be too wide")

def test_scroll_behavior(page, viewport_name, viewport):
    """Test horizontal scroll issues"""
    page.set_viewport_size(viewport)
    page.goto('http://localhost:3000', wait_until='networkidle')

    # Check for horizontal scroll
    has_h_scroll = page.evaluate("""
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    """)

    if has_h_scroll:
        print(f"  WARNING: Page has horizontal scroll at {viewport_name}")
        # Find overflowing elements
        overflowing = page.evaluate("""
            () => {
                const elements = document.querySelectorAll('*');
                const viewport = document.documentElement.clientWidth;
                const overflowing = [];
                for (const el of elements) {
                    const rect = el.getBoundingClientRect();
                    if (rect.right > viewport + 5 && el.tagName !== 'HTML' && el.tagName !== 'BODY') {
                        overflowing.push({
                            tag: el.tagName,
                            class: el.className.slice(0, 50),
                            right: Math.round(rect.right),
                            overflow: Math.round(rect.right - viewport)
                        });
                    }
                }
                return overflowing.slice(0, 5);  // Top 5
            }
        """)
        for el in overflowing:
            print(f"    Overflow: <{el['tag']}> class='{el['class']}' overflows by {el['overflow']}px")

def main():
    ensure_output_dir()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("\n=== Mobile Responsiveness Test ===\n")

        for viewport_name, viewport in VIEWPORTS.items():
            print(f"\nTesting {viewport_name} ({viewport['width']}x{viewport['height']}):")

            print("\n  Landing Page:")
            test_landing_page(page, viewport_name, viewport)

            print("\n  Scroll Behavior:")
            test_scroll_behavior(page, viewport_name, viewport)

            print("\n  Dashboard/Login:")
            test_dashboard(page, viewport_name, viewport)

        browser.close()

    print(f"\n=== Test Complete ===")
    print(f"Screenshots saved to: {OUTPUT_DIR}")
    print(f"View with: ls -la {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
