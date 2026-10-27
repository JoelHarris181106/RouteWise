# RouteWise — Deterministic Finite Automaton (FLAT Integration)

## 1. Subject Overview
- **Subject:** Formal Language and Automata Theory (FLAT)
- **Module Focus:** Finite Automata, Regular Languages, Deterministic State Transition Systems.
- **Component in RouteWise:** Status Code Automaton Validator (`backend/app/dfa/`).

---

## 2. Formal Mathematical Definition

The validator is implemented as a genuine Deterministic Finite Automaton (DFA) defined by the formal 5-tuple:
$$M = (Q, \Sigma, \delta, q_0, F)$$

### 2.1 Formal Language Accepted ($L$)
The language $L(M)$ contains the exact set of valid operational transit status tokens:
$$L(M) = \{ \text{'ON\_TIME'}, \text{'DELAYED'}, \text{'CANCELLED'}, \text{'MAINTENANCE'}, \text{'DIVERTED'} \}$$

### 2.2 Alphabet ($\Sigma$)
The input alphabet consists of uppercase ASCII characters and the underscore symbol:
$$\Sigma = \{ \text{A, B, C, D, E, I, L, M, N, O, R, S, T, V, Y, \_} \}$$

### 2.3 States ($Q$)
The set of states $Q$ includes:
- **Initial State:** $q_0$
- **Trap / Dead State:** $q_{\text{trap}}$ (an absorbing non-accepting state: $\forall a \in \Sigma, \, \delta(q_{\text{trap}}, a) = q_{\text{trap}}$)
- **Intermediate Prefix States:**
  - `ON_TIME` branch: $q_O, q_{ON}, q_{ON\_}, q_{ON\_T}, q_{ON\_TI}, q_{ON\_TIM}$
  - `DELAYED` branch: $q_D, q_{DE}, q_{DEL}, q_{DELA}, q_{DELAY}, q_{DELAYE}$
  - `DIVERTED` branch: $q_D, q_{DI}, q_{DIV}, q_{DIVE}, q_{DIVER}, q_{DIVERT}, q_{DIVERTE}$
  - `CANCELLED` branch: $q_C, q_{CA}, q_{CAN}, q_{CANC}, q_{CANCE}, q_{CANCEL}, q_{CANCELL}, q_{CANCELLE}$
  - `MAINTENANCE` branch: $q_M, q_{MA}, q_{MAI}, q_{MAIN}, q_{MAINT}, q_{MAINTE}, q_{MAINTEN}, q_{MAINTENA}, q_{MAINTENAN}, q_{MAINTENANC}$
- **Accepting States ($F$):**
  $$F = \{ q_{\text{ACC\_ON\_TIME}}, q_{\text{ACC\_DELAYED}}, q_{\text{ACC\_CANCELLED}}, q_{\text{ACC\_MAINTENANCE}}, q_{\text{ACC\_DIVERTED}} \}$$

---

## 3. Transition Function ($\delta: Q \times \Sigma \to Q$)

Every state transition is deterministic. If an input character is unexpected at state $q$, the transition leads to $q_{\text{trap}}$:
$$\delta(q, a) = q_{\text{trap}} \quad \text{for undefined }(q, a)$$

### Transition Table Sample

| Current State ($q$) | Input Symbol ($a$) | Next State ($\delta(q, a)$) | State Classification |
|---|---|---|---|
| $q_0$ | `'O'` | $q_O$ | Intermediate |
| $q_0$ | `'D'` | $q_D$ | Intermediate |
| $q_0$ | `'C'` | $q_C$ | Intermediate |
| $q_0$ | `'M'` | $q_M$ | Intermediate |
| $q_O$ | `'N'` | $q_{ON}$ | Intermediate |
| $q_{ON}$ | `'_'` | $q_{ON\_}$ | Intermediate |
| $q_{ON\_TIM}$ | `'E'` | $q_{\text{ACC\_ON\_TIME}}$ | **Accepting State** |
| $q_D$ | `'E'` | $q_{DE}$ | Intermediate (leads to DELAYED) |
| $q_D$ | `'I'` | $q_{DI}$ | Intermediate (leads to DIVERTED) |
| $q_{\text{DELAYE}}$ | `'D'` | $q_{\text{ACC\_DELAYED}}$ | **Accepting State** |
| $q_{\text{CANCELLE}}$ | `'D'` | $q_{\text{ACC\_CANCELLED}}$ | **Accepting State** |
| $q_{\text{MAINTENANC}}$| `'E'` | $q_{\text{ACC\_MAINTENANCE}}$ | **Accepting State** |
| $q_{\text{DIVERTE}}$ | `'D'` | $q_{\text{ACC\_DIVERTED}}$ | **Accepting State** |
| $q_{\text{trap}}$ | Any $a \in \Sigma$ | $q_{\text{trap}}$ | Dead / Trap State |

---

## 4. Rejection Diagnostics and Error Localization

The DFA validator processes the string character-by-character from left to right, maintaining a formal execution trace:
1. **Empty String ($\epsilon$):**
   - The automaton remains in $q_0$.
   - Since $q_0 \notin F$, the input is rejected with explanation: *"Input is empty (epsilon); initial state q0 is non-accepting."*
2. **Invalid Character / Unknown Word:**
   - At the first illegal character, $\delta(q_{\text{curr}}, c) = q_{\text{trap}}$.
   - The validator records the exact character index (`error_position`) where the deviation occurred.
3. **Incomplete Prefix:**
   - Example: `'DELAY'`.
   - The automaton halts in state $q_{\text{DELAY}}$.
   - Since $q_{\text{DELAY}} \notin F$ and $q_{\text{DELAY}} \neq q_{\text{trap}}$, the diagnosis indicates: *"Input string consumed completely, but automaton halted in intermediate non-accepting prefix state."*
4. **Extra Suffix / Extension:**
   - Example: `'ON_TIME_EXTRA'`.
   - After reaching $q_{\text{ACC\_ON\_TIME}}$, the next character `'_'` causes $\delta(q_{\text{ACC\_ON\_TIME}}, \text{'\_'}) = q_{\text{trap}}$, properly rejecting trailing garbage.

---

## 5. Architectural Role in RouteWise
The DFA is used as an input-validation filter in the transit system pipeline (Stage 2: Validation). Disruption records, transit event broadcasts, and service status codes are validated against the formal language before graph updates are applied.
