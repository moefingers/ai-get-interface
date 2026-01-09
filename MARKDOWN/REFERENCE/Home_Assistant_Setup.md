# Home Assistant Setup for AI Get Interface

This guide sets up a "fake media player" in Home Assistant that receives voice commands from Google Assistant and forwards them to your AI Get Interface endpoint.

## How It Works

```
"Hey Google, play pushups 3 10 on Workout Logger"
     ↓
Google Home sees "Workout Logger" as a media player
     ↓
Home Assistant receives "pushups 3 10" as media_content_id
     ↓
Automation parses values and calls your endpoint
     ↓
Response returned, Google can announce "Done"
```

## Prerequisites

1. **Home Assistant** running (Raspberry Pi, Docker, VM, etc.)
2. **Google Home integration** linked to Home Assistant
3. Your list's **token** and **slug** from AI Get Interface

---

## Configuration

Add to your `configuration.yaml`:

```yaml
# ===========================================
# REST Commands - API calls to your endpoint
# ===========================================
rest_command:
  # Generic list add command - works with any list
  add_to_list:
    url: "https://ai-get-interface.vercel.app/go/{{ slug }}/add"
    method: GET
    # URL params are passed via the URL template
    
  # Workout Tracker - 3 fields: Activity, Sets, Reps
  add_workout:
    url: >-
      https://ai-get-interface.vercel.app/go/workout-tracker/add?token=YOUR_TOKEN_HERE&source=google-home&1={{ activity }}&2={{ sets }}&3={{ reps }}
    method: GET

  # Grocery List - 1 field: Item
  add_grocery:
    url: >-
      https://ai-get-interface.vercel.app/go/groceries/add?token=YOUR_TOKEN_HERE&source=google-home&1={{ item }}
    method: GET


# ===========================================
# Input Text Helpers - Store voice input
# ===========================================
input_text:
  workout_input:
    name: Workout Input
    max: 255
  grocery_input:
    name: Grocery Input
    max: 255


# ===========================================
# Universal Media Players - "Fake speakers"
# ===========================================
media_player:
  # Workout Logger - parses: "activity sets reps"
  - platform: universal
    name: Workout Logger
    unique_id: workout_logger_media_player
    device_class: speaker
    commands:
      play_media:
        action: script.process_workout_voice
        data:
          media_content_id: "{{ media_content_id }}"
    attributes:
      state: input_text.workout_input

  # Grocery Logger - single item
  - platform: universal
    name: Grocery Logger  
    unique_id: grocery_logger_media_player
    device_class: speaker
    commands:
      play_media:
        action: script.process_grocery_voice
        data:
          media_content_id: "{{ media_content_id }}"
    attributes:
      state: input_text.grocery_input


# ===========================================
# Scripts - Process voice commands
# ===========================================
script:
  process_workout_voice:
    alias: "Process Workout Voice Command"
    description: "Parses 'activity sets reps' and calls API"
    fields:
      media_content_id:
        description: "Raw voice input"
    sequence:
      - variables:
          # Split input by spaces: "pushups 3 10" → ["pushups", "3", "10"]
          parts: "{{ media_content_id.split(' ') }}"
          activity: "{{ parts[0] | default('unknown') }}"
          sets: "{{ parts[1] | default('1') }}"
          reps: "{{ parts[2] | default('1') }}"
      - action: rest_command.add_workout
        data:
          activity: "{{ activity }}"
          sets: "{{ sets }}"
          reps: "{{ reps }}"
        response_variable: response
      - action: system_log.write
        data:
          message: "Workout logged: {{ activity }} {{ sets }}x{{ reps }} - Status: {{ response.status }}"
          level: info

  process_grocery_voice:
    alias: "Process Grocery Voice Command"
    description: "Sends item to grocery list"
    fields:
      media_content_id:
        description: "Raw voice input"
    sequence:
      - action: rest_command.add_grocery
        data:
          item: "{{ media_content_id | urlencode }}"
        response_variable: response
      - action: system_log.write
        data:
          message: "Grocery added: {{ media_content_id }} - Status: {{ response.status }}"
          level: info
```

---

## Usage

After restarting Home Assistant and syncing with Google Home:

### Workout Tracker
```
"Hey Google, play pushups 3 10 on Workout Logger"
"Hey Google, play squats 4 15 on Workout Logger"
"Hey Google, play running 1 30 on Workout Logger"
```

### Grocery List
```
"Hey Google, play milk on Grocery Logger"
"Hey Google, play bread and eggs on Grocery Logger"
```

---

## Tips

### Expose to Google Home
1. Go to **Settings → Devices & Services → Google Assistant**
2. Click **Expose entities** 
3. Find your media players and enable them
4. Say "Hey Google, sync my devices"

### Debugging
Check Home Assistant logs:
```
Settings → System → Logs → Filter by "rest_command"
```

### Test Without Voice
Use Developer Tools → Services:
```yaml
service: script.process_workout_voice
data:
  media_content_id: "pushups 3 10"
```

---

## Apple HomeKit (Siri)

The same media players can be exposed to Siri via **HomeKit Bridge**:

```yaml
homekit:
  - filter:
      include_entities:
        - media_player.workout_logger
        - media_player.grocery_logger
```

Then: "Hey Siri, play pushups 3 10 on Workout Logger"

---

## Advanced: Dynamic List Selection

For a single "AI Logger" that routes to different lists:

```yaml
media_player:
  - platform: universal
    name: AI Logger
    unique_id: ai_logger_universal
    device_class: speaker
    commands:
      play_media:
        action: script.route_voice_command
        data:
          media_content_id: "{{ media_content_id }}"

script:
  route_voice_command:
    sequence:
      - variables:
          # First word is the list name
          parts: "{{ media_content_id.split(' ') }}"
          list_name: "{{ parts[0] | lower }}"
          values: "{{ parts[1:] | join(' ') }}"
      - choose:
          - conditions: "{{ list_name == 'workout' }}"
            sequence:
              - action: script.process_workout_voice
                data:
                  media_content_id: "{{ values }}"
          - conditions: "{{ list_name == 'grocery' }}"
            sequence:
              - action: script.process_grocery_voice
                data:
                  media_content_id: "{{ values }}"
        default:
          - action: system_log.write
            data:
              message: "Unknown list: {{ list_name }}"
              level: warning
```

Usage: "Hey Google, play workout pushups 3 10 on AI Logger"
