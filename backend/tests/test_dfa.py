import pytest
from backend.app.dfa.automaton import TransportStatusDFA

@pytest.fixture
def dfa():
    return TransportStatusDFA()

def test_dfa_accepts_valid_keywords(dfa):
    valid_codes = ["ON_TIME", "DELAYED", "CANCELLED", "MAINTENANCE", "DIVERTED"]
    for code in valid_codes:
        result = dfa.validate(code)
        assert result.is_accepted is True, f"DFA should accept '{code}'"
        assert result.final_state in dfa.accepting_states
        assert result.error_position is None
        assert len(result.trace) == len(code)

def test_dfa_rejects_empty_string(dfa):
    res = dfa.validate("")
    assert res.is_accepted is False
    assert res.final_state == dfa.initial_state
    assert res.error_position == 0

def test_dfa_rejects_case_sensitivity(dfa):
    # DFA language is strictly uppercase
    invalid_cases = ["on_time", "Delayed", "Cancelled", "maintenance"]
    for code in invalid_cases:
        res = dfa.validate(code)
        assert res.is_accepted is False
        assert res.final_state == dfa.trap_state

def test_dfa_rejects_incomplete_prefixes(dfa):
    # 'DELAY' is an incomplete prefix of 'DELAYED'
    res = dfa.validate("DELAY")
    assert res.is_accepted is False
    assert res.final_state != dfa.trap_state  # Halts in valid intermediate state
    assert res.final_state not in dfa.accepting_states

def test_dfa_pinpoints_rejection_character(dfa):
    # 'DELA!ED' has '!' at index 4
    res = dfa.validate("DELA!ED")
    assert res.is_accepted is False
    assert res.final_state == dfa.trap_state
    assert res.error_position == 4

def test_dfa_specification_and_table(dfa):
    spec = dfa.get_specification()
    assert spec.initial_state == "q0"
    assert len(spec.accepting_states) == 5
    assert "O" in spec.alphabet
    assert "D" in spec.alphabet
    assert len(spec.transition_table) > 0
