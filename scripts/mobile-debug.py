#!/usr/bin/env python3
"""
Debug script to understand the mobile header structure
"""

from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # Set mobile viewport
    page.set_viewport_size({'width': 375, 'height': 667})
    page.goto('http://localhost:3000', wait_until='networkidle')
    page.wait_for_timeout(1000)

    print("=== Mobile Header Debug ===\n")

    # Get header HTML
    header = page.locator('header').first
    if header.count() > 0:
        header_html = header.inner_html()
        print("Header HTML (truncated):")
        print(header_html[:2000])
        print("\n")

    # Find all buttons in header
    print("Buttons in header:")
    header_buttons = page.locator('header button')
    count = header_buttons.count()
    print(f"Found {count} buttons")
    for i in range(count):
        btn = header_buttons.nth(i)
        classes = btn.get_attribute('class') or ''
        text = btn.inner_text()
        is_visible = btn.is_visible()
        box = btn.bounding_box()
        print(f"  Button {i+1}: visible={is_visible}, text='{text[:30]}', class='{classes[:50]}...'")
        if box:
            print(f"    Position: x={box['x']:.0f}, y={box['y']:.0f}, w={box['width']:.0f}, h={box['height']:.0f}")

    # Find all links in header
    print("\nLinks in header:")
    header_links = page.locator('header a')
    count = header_links.count()
    print(f"Found {count} links")
    for i in range(min(count, 10)):  # Limit to 10
        link = header_links.nth(i)
        href = link.get_attribute('href') or ''
        text = link.inner_text()
        is_visible = link.is_visible()
        print(f"  Link {i+1}: visible={is_visible}, href='{href}', text='{text[:30]}'")

    # Check SVG icons
    print("\nSVG icons in header:")
    svgs = page.locator('header svg')
    count = svgs.count()
    print(f"Found {count} SVGs")
    for i in range(min(count, 10)):
        svg = svgs.nth(i)
        classes = svg.get_attribute('class') or ''
        is_visible = svg.is_visible()
        print(f"  SVG {i+1}: visible={is_visible}, class='{classes}'")

    # Take close-up of header
    page.screenshot(path='/tmp/mobile-screenshots/header_closeup.png', clip={'x': 0, 'y': 0, 'width': 375, 'height': 80})
    print("\nSaved header closeup to /tmp/mobile-screenshots/header_closeup.png")

    browser.close()
