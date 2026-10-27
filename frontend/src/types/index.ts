export interface Stop {
  id: string;
  name: string;
  zone: number;
  x: number;
  y: number;
  lines: string[];
  is_transfer_station: boolean;
  status: string;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  mode: 'metro' | 'bus';
  line_name: string;
  travel_time: number;
  fare: number;
  distance_km: number;
  status: string;
  is_active: boolean;
}

export interface TransportNetwork {
  network_name: string;
  version: string;
  description: string;
  stops: Stop[];
  edges: Edge[];
}

export interface Disruption {
  id: string;
  title: string;
  description: string;
  affected_edges: string[];
  affected_stops: string[];
  status_code: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  is_active: boolean;
}

export interface JourneySegment {
  segment_index: number;
  from_stop_id: string;
  from_stop_name: string;
  to_stop_id: string;
  to_stop_name: string;
  mode: string;
  line_name: string;
  travel_time: number;
  fare: number;
  distance_km: number;
}

export interface RouteOption {
  category: 'fastest' | 'cheapest' | 'fewest_transfers' | 'balanced';
  title: string;
  total_time_mins: number;
  total_fare: number;
  transfers_count: number;
  total_distance_km: number;
  stops_sequence: string[];
  stops_names: string[];
  segments: JourneySegment[];
  lines_used: string[];
  explanation: string;
  is_feasible: boolean;
  coincides_with: string[];
}

export interface RoutePlanResponse {
  origin: string;
  origin_name: string;
  destination: string;
  destination_name: string;
  transport_mode_filter: string;
  routes: {
    fastest?: RouteOption;
    cheapest?: RouteOption;
    fewest_transfers?: RouteOption;
    balanced?: RouteOption;
  };
  active_disruptions_count: number;
  notice: string;
}

export interface DfaStepTrace {
  step: number;
  character: string;
  from_state: string;
  to_state: string;
  valid_step: boolean;
}

export interface DfaValidationResult {
  input_code: string;
  is_accepted: boolean;
  final_state: string;
  visited_states: string[];
  trace: DfaStepTrace[];
  explanation: string;
  error_position?: number | null;
  language_spec: string;
}

export interface DfaSpecResponse {
  alphabet: string[];
  states: string[];
  initial_state: string;
  accepting_states: string[];
  transition_table: Record<string, Record<string, string>>;
  language_description: string;
}

export interface PipelineGanttBlock {
  request_id: number;
  stage: string;
  stage_name: string;
  start_cycle: number;
  end_cycle: number;
  is_pipelined: boolean;
}

export interface PipelineSimResult {
  num_requests: number;
  stage_durations: Record<string, number>;
  sequential_cycles: number;
  pipelined_cycles: number;
  speedup: number;
  theoretical_max_speedup: number;
  sequential_throughput: number;
  pipelined_throughput: number;
  pipeline_efficiency_percent: number;
  timeline_sequential: PipelineGanttBlock[];
  timeline_pipelined: PipelineGanttBlock[];
  pipeline_fill_cycles: number;
  bottleneck_stage: string;
  bottleneck_duration: number;
  analysis: string;
}
