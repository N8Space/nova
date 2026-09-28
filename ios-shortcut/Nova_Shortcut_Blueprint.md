# Nova iOS Shortcut Setup & Siri Integration Blueprint

This guide provides exact, step-by-step visual UI instructions for creating the **"Activate Nova"** shortcut on iOS (including iPhone 15 Pro / 16 Pro / 17 Pro).

---

## 1. Quick Overview

The **Activate Nova** shortcut allows you to trigger your executive assistant by saying **"Siri, Activate Nova"** or pressing your iPhone's **Action Button**. It captures your voice dictation, packages your persistent `session_id`, sends an HTTP POST request to your n8n `/nova-capture` webhook, and speaks Nova's response aloud.

---

## 2. Step-by-Step iOS Shortcuts App Setup

Open the **Shortcuts** app on your iPhone, tap **`+`** (top right) to create a new shortcut, and rename it to **`Activate Nova`**.

Add the following actions in exact order from the action search bar at the bottom:

---

### Step 1: Manage Persistent Session ID (Native iOS Actions)

1. Search for action **`Get Contents of Folder`** (Documents category):
   - Service: `Shortcuts` / Subpath: `Nova`
2. Search for action **`Filter Files`**:
   - Filter `Folder Contents` where `Name` **is** `session_id.txt`
3. Search for action **`If`**:
   - Condition: **If** `Files` *has no value*
   - **Inside the `If` block:**
     1. Search for action **`Current Date`**.
     2. Search for action **`Random Number`**:
        - Set **Minimum**: `100000`
        - Set **Maximum**: `999999`
     3. Search for action **`Text`**:
        - In the text field, type: `Session-` then select Magic Variable **`Current Date`** followed by Magic Variable **`Random Number`** *(Result example: `Session-20260722-584920`)*.
     4. Search for action **`Save File`**:
        - Text to save: Select Magic Variable -> **`Text`**
        - Service: `Shortcuts`
        - Subpath: `Nova/session_id.txt`
        - Turn **ON** *"Overwrite If File Exists"*
     5. Search for action **`Get File`**:
        - File Path: `Nova/session_id.txt`
   - Tap **End If**
4. Search for action **`Set Variable`**:
   - Set Variable Name: `SessionID`
   - Value: Select Magic Variable -> **`File`**

---

### Step 2: Spoken Voice Greeting & Dictation Input

1. Search for action **`Speak Text`** *(Automatic Voice Greeting)*:
   - Text to speak: `Go for Nova`
   - Turn **ON** *"Wait Until Finished"*
2. Search for action **`Dictate Text`**:
   - Tap **Language** -> Select `English (United States)` (or your preferred spoken language).
   - Tap **Stop Dictating** -> Select `After Pause` (or `After Short Pause`).
3. Search for action **`Set Variable`**:
   - Variable Name: `UserInput`
   - Value: Select Magic Variable -> **`Dictated Text`**.

---

### Step 3: Configure HTTP POST Webhook to n8n

1. Search for action **`URL`**:
   - Enter your exact n8n webhook URL:
     - Production URL: `https://automation.lesterlabs.cloud/webhook/nova-capture`
2. Search for action **`Get Contents of URL`**:
   - Input: Magic Variable **`URL`**
   - Tap the **`>`** arrow next to the action to expand request options:
     - **Method**: Change from `GET` to **`POST`**
     - **Headers**: Tap **Add new header**:
       - Key: `Content-Type` | Value: `application/json`
       - Key: `X-Session-ID` | Value: Tap Magic Variable -> **`SessionID`**
     - **Request Body**: Change from `File` to **`JSON`**
     - **Add new field**:
       - Field 1: Key `session_id` (Text) -> Select Magic Variable **`SessionID`**
       - Field 2: Key `text_input` (Text) -> Select Magic Variable **`UserInput`**
       - Field 3: Key `timestamp` (Text) -> Select **Current Date** (Format: ISO 8601)
3. Search for action **`Set Variable`**:
   - Variable Name: `n8nResponse`
   - Value: Select Magic Variable -> **`Contents of URL`**

---

### Step 4: Parse n8n Response & Spoken Output

1. Search for action **`Get Dictionary Value`**:
   - Key: `status`
   - Dictionary: Select Magic Variable -> **`n8nResponse`**
2. Search for action **`Get Dictionary Value`**:
   - Key: `message`
   - Dictionary: Select Magic Variable -> **`n8nResponse`**
3. Search for action **`Set Variable`**:
   - Variable Name: `MessageVal`
   - Value: Select Magic Variable -> **`Dictionary Value`** (from step 2)
4. Search for action **`Text`** *(Guarantees Text type comparison in iOS 17/18)*:
   - Type in text box: Select Magic Variable -> **`Dictionary Value`** (from step 1, the `status` output).
5. Search for action **`If`**:
   - Input: Select Magic Variable -> **`Text`** (from step 4)
   - **Condition**: Select **`is`** *(The 'is' condition now appears automatically because input is a Text block!)*
   - **Value**: Enter `NEEDS_CLARIFICATION`
6. **Inside the `If` block (Clarification Path):**
   1. Search for action **`Speak Text`**:
      - Text: Select Magic Variable -> **`MessageVal`** (Turn **ON** *"Wait Until Finished"*)
   2. Search for action **`Run Shortcut`**:
      - **Shortcut**: Select **`Activate Nova`**
      - **Input**: Leave blank / empty *(No input needed — session ID is read directly from iCloud file)*
7. **Inside the `Otherwise` block (Completed Path):**
   1. Search for action **`Speak Text`**:
      - Text: Select Magic Variable -> **`MessageVal`** (Turn **ON** *"Wait Until Finished"*)
   2. Search for action **`Show Notification`**:
      - Title: `Nova Executive Assistant`
      - Body: Select Magic Variable -> **`MessageVal`**

Tap **Done** (top right) to save the shortcut.


---

## 3. Siri, Action Button & Hardware Binding Instructions

### Siri Voice Activation
- Simply say: **"Siri, Activate Nova"** (or *"Hey Siri, Activate Nova"*).
- iOS will automatically run the shortcut and begin voice dictation immediately.

### Physical Action Button (iPhone 15 Pro / 16 Pro / 17 Pro)
1. Open **Settings** on your iPhone.
2. Tap **Action Button**.
3. Swipe to **Shortcut**.
4. Tap the selection menu -> Choose **Activate Nova**.
5. Press and hold the physical Action Button anytime to launch Nova instantly.

### Camera Control / Back Tap / Lock Screen Widgets
- **Lock Screen / Control Center**: Open **Control Center** -> Edit Controls -> Add **Shortcut** -> Select **Activate Nova**.
- **Back Tap**: Go to **Settings -> Accessibility -> Touch -> Back Tap -> Double Tap** -> Select **Activate Nova**.
