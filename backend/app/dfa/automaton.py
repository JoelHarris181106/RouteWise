from typing import Dict, List, Set, Tuple, Optional
from ..models.schemas import DfaValidationResult, DfaStepTrace, DfaSpecResponse

class TransportStatusDFA:
    """
    Deterministic Finite Automaton (DFA) M = (Q, Sigma, delta, q0, F)
    Formally validates public transit status codes character-by-character.
    
    Language accepted:
    L = { 'ON_TIME', 'DELAYED', 'CANCELLED', 'MAINTENANCE', 'DIVERTED' }
    
    Alphabet Sigma: Uppercase ASCII letters [A-Z] and underscore '_'
    """

    def __init__(self):
        self.initial_state = "q0"
        self.trap_state = "q_trap"

        self.accepting_states: Set[str] = {
            "q_ACC_ON_TIME",
            "q_ACC_DELAYED",
            "q_ACC_CANCELLED",
            "q_ACC_MAINTENANCE",
            "q_ACC_DIVERTED"
        }

        # Transition function delta: Dict[current_state, Dict[char, next_state]]
        self.delta: Dict[str, Dict[str, str]] = {}
        self._build_transition_table()
        
        # All states Q
        self.states: Set[str] = {self.initial_state, self.trap_state}.union(self.accepting_states)
        for s in self.delta:
            self.states.add(s)
            for target in self.delta[s].values():
                self.states.add(target)

        # Alphabet Sigma
        self.alphabet: List[str] = sorted(list(
            set(char for transitions in self.delta.values() for char in transitions.keys())
        ))

    def _add_path(self, word: str, accepting_state: str):
        """Construct deterministic state sequence for a valid keyword."""
        curr = self.initial_state
        for i, char in enumerate(word):
            is_last = (i == len(word) - 1)
            next_state = accepting_state if is_last else f"q_{word[:i+1]}"
            
            if curr not in self.delta:
                self.delta[curr] = {}
            
            # If path branches (e.g. 'D' in DELAYED vs DIVERTED)
            if char in self.delta[curr]:
                curr = self.delta[curr][char]
            else:
                self.delta[curr][char] = next_state
                curr = next_state

    def _build_transition_table(self):
        # 1. ON_TIME
        self._add_path("ON_TIME", "q_ACC_ON_TIME")
        # 2. DELAYED
        self._add_path("DELAYED", "q_ACC_DELAYED")
        # 3. CANCELLED
        self._add_path("CANCELLED", "q_ACC_CANCELLED")
        # 4. MAINTENANCE
        self._add_path("MAINTENANCE", "q_ACC_MAINTENANCE")
        # 5. DIVERTED
        self._add_path("DIVERTED", "q_ACC_DIVERTED")

    def transition(self, current_state: str, char: str) -> str:
        """Delta transition function: delta(q, char). Returns q_trap if undefined."""
        if current_state == self.trap_state:
            return self.trap_state
        
        state_transitions = self.delta.get(current_state, {})
        return state_transitions.get(char, self.trap_state)

    def validate(self, input_string: str) -> DfaValidationResult:
        """
        Processes input character by character and records full formal execution trace.
        """
        curr_state = self.initial_state
        visited_states = [curr_state]
        trace: List[DfaStepTrace] = []
        error_pos: Optional[int] = None
        has_errored = False

        if not input_string:
            return DfaValidationResult(
                input_code="",
                is_accepted=False,
                final_state=curr_state,
                visited_states=visited_states,
                trace=[],
                explanation="Input is empty (epsilon). The initial state q0 is not an accepting state.",
                error_position=0
            )

        for idx, char in enumerate(input_string):
            next_state = self.transition(curr_state, char)
            is_valid_step = (next_state != self.trap_state)

            trace.append(DfaStepTrace(
                step=idx + 1,
                character=char,
                from_state=curr_state,
                to_state=next_state,
                valid_step=is_valid_step
            ))

            if not is_valid_step and not has_errored:
                error_pos = idx
                has_errored = True

            curr_state = next_state
            visited_states.append(curr_state)

        is_accepted = (curr_state in self.accepting_states)

        # Generate educational explanation
        if is_accepted:
            explanation = (
                f"Accepted: Input '{input_string}' completed execution in accepting state '{curr_state}'. "
                f"It is a recognized valid transit status code."
            )
        elif has_errored:
            bad_char = input_string[error_pos] if error_pos is not None else '?'
            explanation = (
                f"Rejected: Character '{bad_char}' at position {error_pos} caused an undefined transition "
                f"leading to dead/trap state '{self.trap_state}'. Valid tokens cannot contain this sequence."
            )
        else:
            explanation = (
                f"Rejected: Input consumed completely, but automaton halted in intermediate non-accepting state '{curr_state}'. "
                f"The string is an incomplete prefix of a valid status code."
            )

        return DfaValidationResult(
            input_code=input_string,
            is_accepted=is_accepted,
            final_state=curr_state,
            visited_states=visited_states,
            trace=trace,
            explanation=explanation,
            error_position=error_pos
        )

    def get_specification(self) -> DfaSpecResponse:
        """Returns the formal specification 5-tuple for interactive visualization."""
        # Clean exportable transition table
        table_export: Dict[str, Dict[str, str]] = {}
        for state in sorted(list(self.states)):
            table_export[state] = {}
            for ch in self.alphabet:
                dest = self.transition(state, ch)
                if dest != self.trap_state:
                    table_export[state][ch] = dest

        return DfaSpecResponse(
            alphabet=self.alphabet,
            states=sorted(list(self.states)),
            initial_state=self.initial_state,
            accepting_states=sorted(list(self.accepting_states)),
            transition_table=table_export,
            language_description="Formal language of valid transit operating status codes: L = { ON_TIME, DELAYED, CANCELLED, MAINTENANCE, DIVERTED }"
        )

# Singleton validator instance
dfa_instance = TransportStatusDFA()
