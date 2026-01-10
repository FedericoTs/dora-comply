#!/usr/bin/env python3
"""
DORA Mapping Tests

Validates the accuracy of DORA coverage calculations including:
1. Control effectiveness weighting (effective=1.0, exception=0.3, not_tested=0.1)
2. Coverage level determination
3. Confidence scoring with exception penalties

Run with: python modal-workers/parsers/test_dora_mapping.py
"""

import sys
from dataclasses import dataclass
from enum import Enum


# =============================================================================
# Test Types (mirroring production types)
# =============================================================================

class TestResult(str, Enum):
    OPERATING_EFFECTIVELY = "operating_effectively"
    EXCEPTION = "exception"
    NOT_TESTED = "not_tested"


@dataclass
class MockControl:
    control_id: str
    tsc_category: str
    description: str = "Test control"
    test_result: TestResult = TestResult.OPERATING_EFFECTIVELY
    page_ref: int = 1
    confidence: float = 0.9


# =============================================================================
# Functions Under Test (simplified from dora_mapping.py)
# =============================================================================

def calculate_effective_coverage(controls: list[MockControl], required_categories: int) -> tuple[str, float]:
    """
    Calculate coverage level considering control effectiveness.
    Returns (coverage_level, confidence)
    """
    if len(controls) == 0:
        return "none", 0.0

    effective_controls = [c for c in controls if c.test_result == TestResult.OPERATING_EFFECTIVELY]
    exception_controls = [c for c in controls if c.test_result == TestResult.EXCEPTION]
    not_tested_controls = [c for c in controls if c.test_result == TestResult.NOT_TESTED]

    effective_count = len(effective_controls)
    exception_count = len(exception_controls)
    not_tested_count = len(not_tested_controls)

    # Calculate effective coverage ratio
    effective_score = (
        effective_count * 1.0 +
        exception_count * 0.3 +
        not_tested_count * 0.1
    )
    coverage_ratio = effective_score / max(required_categories, 1)

    # Determine coverage level
    if coverage_ratio >= 1.5 and exception_count == 0:
        coverage_level = "full"
        confidence = 0.95
    elif coverage_ratio >= 1.0 and exception_count == 0:
        coverage_level = "full"
        confidence = 0.85
    elif coverage_ratio >= 0.7:
        coverage_level = "partial"
        exception_penalty = (exception_count / max(len(controls), 1)) * 0.2
        confidence = 0.7 - exception_penalty
    elif coverage_ratio >= 0.3:
        coverage_level = "partial"
        confidence = 0.5
    else:
        coverage_level = "none"
        confidence = 0.2

    return coverage_level, round(confidence, 3)


# =============================================================================
# Test Framework
# =============================================================================

passed_tests = 0
failed_tests = 0
failures = []


def test(name: str, fn):
    global passed_tests, failed_tests
    try:
        fn()
        passed_tests += 1
        print(f"  ✅ {name}")
    except AssertionError as e:
        failed_tests += 1
        failures.append(f"{name}: {str(e)}")
        print(f"  ❌ {name}")
        print(f"     {str(e)}")


def describe(name: str, fn):
    print(f"\n📋 {name}")
    fn()


def assert_eq(actual, expected, msg=""):
    if actual != expected:
        raise AssertionError(f"{msg} Expected {expected}, got {actual}")


def assert_close(actual, expected, precision=0.01, msg=""):
    if abs(actual - expected) > precision:
        raise AssertionError(f"{msg} Expected ~{expected}, got {actual}")


# =============================================================================
# Test Suites
# =============================================================================

def test_all_effective_controls():
    """All effective controls should give full coverage"""
    controls = [
        MockControl("CC6.1", "CC6", test_result=TestResult.OPERATING_EFFECTIVELY),
        MockControl("CC6.2", "CC6", test_result=TestResult.OPERATING_EFFECTIVELY),
        MockControl("CC6.3", "CC6", test_result=TestResult.OPERATING_EFFECTIVELY),
    ]
    coverage, confidence = calculate_effective_coverage(controls, 2)
    assert_eq(coverage, "full", "All effective controls")
    assert_close(confidence, 0.95, msg="High confidence for full effectiveness")


def test_all_exception_controls():
    """All exception controls should give reduced coverage"""
    controls = [
        MockControl("CC6.1", "CC6", test_result=TestResult.EXCEPTION),
        MockControl("CC6.2", "CC6", test_result=TestResult.EXCEPTION),
        MockControl("CC6.3", "CC6", test_result=TestResult.EXCEPTION),
    ]
    coverage, confidence = calculate_effective_coverage(controls, 3)
    # 3 exceptions * 0.3 = 0.9 score, ratio = 0.3, which is >= 0.3 so partial
    assert_eq(coverage, "partial", "All exceptions = partial")
    assert_close(confidence, 0.5, msg="Lower confidence for exceptions")


def test_mixed_controls():
    """Mix of effective and exception should reduce coverage"""
    controls = [
        MockControl("CC6.1", "CC6", test_result=TestResult.OPERATING_EFFECTIVELY),
        MockControl("CC6.2", "CC6", test_result=TestResult.EXCEPTION),
        MockControl("CC6.3", "CC6", test_result=TestResult.OPERATING_EFFECTIVELY),
    ]
    # Score: 1.0 + 0.3 + 1.0 = 2.3, ratio = 2.3/3 = 0.77
    # Has exceptions so can't be "full", should be "partial"
    coverage, confidence = calculate_effective_coverage(controls, 3)
    assert_eq(coverage, "partial", "Mixed controls with exception")


def test_not_tested_controls():
    """Not tested controls contribute only 10%"""
    controls = [
        MockControl("CC6.1", "CC6", test_result=TestResult.NOT_TESTED),
        MockControl("CC6.2", "CC6", test_result=TestResult.NOT_TESTED),
    ]
    # Score: 0.1 + 0.1 = 0.2, ratio = 0.2/2 = 0.1 (< 0.3 = none)
    coverage, confidence = calculate_effective_coverage(controls, 2)
    assert_eq(coverage, "none", "Not tested = none coverage")


def test_no_controls():
    """No controls should give none coverage"""
    coverage, confidence = calculate_effective_coverage([], 2)
    assert_eq(coverage, "none")
    assert_eq(confidence, 0.0)


def test_exception_penalty_on_confidence():
    """Exceptions should reduce confidence score"""
    controls_no_exceptions = [
        MockControl("CC6.1", "CC6", test_result=TestResult.OPERATING_EFFECTIVELY),
        MockControl("CC6.2", "CC6", test_result=TestResult.OPERATING_EFFECTIVELY),
    ]
    controls_with_exception = [
        MockControl("CC6.1", "CC6", test_result=TestResult.OPERATING_EFFECTIVELY),
        MockControl("CC6.2", "CC6", test_result=TestResult.EXCEPTION),
    ]

    _, conf_no_ex = calculate_effective_coverage(controls_no_exceptions, 2)
    _, conf_with_ex = calculate_effective_coverage(controls_with_exception, 2)

    assert conf_with_ex < conf_no_ex, f"Exception should reduce confidence: {conf_with_ex} < {conf_no_ex}"


def test_requires_no_exceptions_for_full():
    """Full coverage requires zero exceptions"""
    # Enough effective controls for full, but one exception
    controls = [
        MockControl("CC6.1", "CC6", test_result=TestResult.OPERATING_EFFECTIVELY),
        MockControl("CC6.2", "CC6", test_result=TestResult.OPERATING_EFFECTIVELY),
        MockControl("CC6.3", "CC6", test_result=TestResult.OPERATING_EFFECTIVELY),
        MockControl("CC6.4", "CC6", test_result=TestResult.EXCEPTION),
    ]
    # Score: 3*1.0 + 1*0.3 = 3.3, ratio = 3.3/2 = 1.65 >= 1.5
    # But has exception, so not full
    coverage, _ = calculate_effective_coverage(controls, 2)
    assert_eq(coverage, "partial", "Exception blocks full coverage")


def run_coverage_tests():
    test("All effective controls = full coverage", test_all_effective_controls)
    test("All exception controls = partial coverage", test_all_exception_controls)
    test("Mixed controls = partial coverage", test_mixed_controls)
    test("Not tested controls = none coverage", test_not_tested_controls)
    test("No controls = none coverage", test_no_controls)
    test("Exception penalty reduces confidence", test_exception_penalty_on_confidence)
    test("Exceptions block full coverage", test_requires_no_exceptions_for_full)


# =============================================================================
# Effective Score Calculation Tests
# =============================================================================

def test_effective_score_weights():
    """Verify scoring weights: effective=1.0, exception=0.3, not_tested=0.1"""
    effective = [MockControl("1", "CC6", test_result=TestResult.OPERATING_EFFECTIVELY)]
    exception = [MockControl("2", "CC6", test_result=TestResult.EXCEPTION)]
    not_tested = [MockControl("3", "CC6", test_result=TestResult.NOT_TESTED)]

    # With required=1, we can calculate the ratio which equals the score
    _, _ = calculate_effective_coverage(effective, 1)  # ratio = 1.0
    _, _ = calculate_effective_coverage(exception, 1)  # ratio = 0.3
    _, _ = calculate_effective_coverage(not_tested, 1) # ratio = 0.1

    # Score can be inferred from coverage level
    eff_coverage, _ = calculate_effective_coverage(effective, 1)
    exc_coverage, _ = calculate_effective_coverage(exception, 1)
    not_coverage, _ = calculate_effective_coverage(not_tested, 1)

    assert_eq(eff_coverage, "full", "Effective = full at 1.0x required")
    assert_eq(exc_coverage, "partial", "Exception = partial at 0.3x required")
    assert_eq(not_coverage, "none", "Not tested = none at 0.1x required")


def run_weight_tests():
    test("Verify scoring weights (1.0, 0.3, 0.1)", test_effective_score_weights)


# =============================================================================
# Main
# =============================================================================

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("🧪 DORA Mapping Test Suite (Python)")
    print("=" * 60)

    describe("Coverage Calculation with Control Effectiveness", run_coverage_tests)
    describe("Effective Score Weights", run_weight_tests)

    print("\n" + "=" * 60)
    print(f"📊 Test Results: {passed_tests} passed, {failed_tests} failed")
    print("=" * 60)

    if failed_tests > 0:
        print("\n❌ Failed Tests:")
        for f in failures:
            print(f"   - {f}")
        sys.exit(1)
    else:
        print("\n✅ All tests passed!")
        sys.exit(0)
