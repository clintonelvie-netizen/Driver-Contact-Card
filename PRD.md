# Product Requirements Document (PRD)

## Geotab Driver Contact Card Add-in

**Product:** GoFleet / ZenduIT Geotab Add-in
**Version:** 1.0
**Status:** Development
**Primary Technology:** JavaScript, HTML, CSS
**Platform:** Geotab
**API:** Geotab API

---

## 1. Product Overview

The Driver Contact Card Add-in is a lightweight Geotab add-in that displays the driver contact information associated with the currently selected vehicle.

The add-in will retrieve the selected vehicle's ID from the Geotab context, use that ID to query the Geotab API for the relevant `DriverChange` record, and display the driver's contact information in a simple card.

The initial release must support **three UI states**:

1. Driver assigned — display the driver's information.
2. Driver assigned but some information is missing — display `—` for missing fields.
3. No driver assigned — display a clear empty-state message.

The source specification explicitly states that all three states must ship and that the empty state should not be treated as an edge case.

---

# 2. Problem Statement

Users viewing a vehicle in Geotab may need to quickly identify the driver associated with that vehicle and access the driver's basic contact information.

Currently, this information may require navigating to other areas of the system.

The add-in should provide this information directly within the vehicle context with minimal interaction.

### User Problem

> "I have selected a vehicle. I want to immediately see who is assigned to it and their contact information."

### Product Solution

When a vehicle is selected, the add-in retrieves the driver's information and displays it in a compact contact card.

---

# 3. Goals

## Primary Goals

The add-in must:

* Detect the vehicle currently selected in Geotab.
* Retrieve the vehicle ID from the Geotab context.
* Query the Geotab API for the driver's assignment.
* Display the driver's:

  * Name
  * Phone
  * Email
  * License
* Gracefully handle missing driver information.
* Gracefully handle missing individual data fields.
* Display a clear error when the API request fails.
* Provide a clean, simple user interface.
* Work entirely within the Geotab add-in environment.

The intended API mechanism is to read `state.device.id`, query `DriverChange` using `deviceSearch.id`, and render the first returned record.

---

# 4. Non-Goals

The first release will **not** include:

* Driver editing.
* Driver creation.
* Driver deletion.
* Vehicle editing.
* Driver assignment functionality.
* Driver history.
* Multiple-driver display.
* Driver search.
* Driver filtering.
* Notifications.
* Messaging.
* Calling the driver.
* Advanced analytics.
* Authentication outside of Geotab.
* A backend server.
* A database.
* Complex state management.
* Mobile-specific functionality.

The goal of Version 1.0 is to establish the basic Geotab add-in development pattern rather than build a complete driver-management application.

---

# 5. Target User

## Primary User

Fleet managers, fleet administrators, dispatchers, customer support personnel, and other Geotab users who need to quickly identify the driver associated with a vehicle.

## User Context

The user:

1. Opens Geotab.
2. Selects a vehicle.
3. Opens/views the Driver Contact Card add-in.
4. Sees the driver's contact information.

---

# 6. User Story

### Primary User Story

**As a Geotab user,**

I want to see the contact information of the driver assigned to the selected vehicle,

**so that**

I can quickly identify and contact the driver without navigating through additional screens.

### Empty-State User Story

**As a Geotab user,**

I want to know when a vehicle has no assigned driver,

**so that**

I am not left looking at an empty or broken interface.

### Missing-Data User Story

**As a Geotab user,**

I want missing driver information to be clearly represented,

**so that**

I can distinguish between unavailable information and an application failure.

---

# 7. Functional Requirements

## FR-01 — Read Selected Vehicle

The add-in must retrieve the currently selected vehicle from the Geotab add-in context.

The vehicle ID must be obtained from:

`state.device.id`

This is the starting point of the data flow defined in the development specification.

### Acceptance Criteria

* The add-in can access the Geotab state.
* The selected vehicle ID is retrieved successfully.
* The vehicle ID is used for the API request.
* The application does not use a hard-coded vehicle ID.

---

## FR-02 — Retrieve Driver Assignment

The add-in must call the Geotab API using a `DriverChange` request.

Conceptually, the request should follow:

`Get → DriverChange → deviceSearch → vehicle ID`

The source implementation example specifies:

```javascript
api.call(
  "Get",
  {
    typeName: "DriverChange",
    search: {
      deviceSearch: {
        id: vehicleId
      }
    }
  },
  successCallback,
  errorCallback
);
```

The implementation must follow the Geotab API contract appropriate to the deployed environment.

### Acceptance Criteria

* API request is initiated after obtaining the vehicle ID.
* The request uses the selected vehicle.
* The application does not request unrelated vehicle data.
* API success and failure callbacks are handled.

---

# 8. Driver Information

When a driver is available, the card should display:

| Field       | Required |
| ----------- | -------- |
| Driver Name | Yes      |
| Phone       | Yes      |
| Email       | Yes      |
| License     | Yes      |

The reference design shows these four pieces of driver information in the assigned-driver state.

---

# 9. UI States

The add-in must implement exactly three primary data states.

## State 1 — Driver Assigned

### Description

A driver is assigned to the selected vehicle and driver information is available.

### Expected UI

Display a driver contact card containing:

**Driver Assigned**

Driver Name

Phone Number

Email Address

License Number

### Example

**DRIVER ASSIGNED**

Olivia Rhye

+1 (416) 555-0134

[olivia@gofleet.com](mailto:olivia@gofleet.com)

D4102-88371-40021

The reference presentation provides this as the target assigned-driver state.

---

## State 2 — Driver Assigned but Data Missing

### Description

A driver is associated with the vehicle, but one or more driver fields are unavailable.

### Expected Behavior

Missing individual values must be represented using:

`—`

The entire card should still be displayed.

### Example

**DRIVER ASSIGNED**

Olivia Rhye

+1 (416) 555-0134

—

—

### Acceptance Criteria

* The card renders successfully.
* Available information is displayed.
* Missing information displays `—`.
* Missing information does not cause a JavaScript error.
* The interface does not appear broken.

The source explicitly requires dashes for empty fields in this state.

---

## State 3 — No Driver Assigned

### Description

The selected vehicle does not have a driver assignment.

### Expected UI

Display a clear empty-state message:

> No driver assigned to this vehicle.

### Acceptance Criteria

* No blank screen is displayed.
* No JavaScript exception is visible to the user.
* The empty-state message is clearly visible.
* The user understands that the vehicle has no assigned driver.

The reference specification explicitly identifies this message and requires the empty state to ship as part of the first release.

---

# 10. Error State

Although the source defines three primary data states, the API failure scenario must also be handled.

If the Geotab API request fails:

* Do not leave the interface blank.
* Display an understandable error message.
* Log useful technical information for debugging.
* Do not expose sensitive API details to the end user.

Example:

**Unable to load driver information.**

Please try again.

The source implementation specifically requires an error callback and states that API failure should result in an on-screen indication rather than a blank interface.

---

# 11. Loading State

The add-in should display a lightweight loading state while the API request is being processed.

Example:

**Loading driver information…**

### Requirements

* Loading state appears after the add-in starts the API request.
* Loading state disappears after success or failure.
* The user should not see stale driver information while a new vehicle is being loaded.

---

# 12. User Experience Requirements

## UX-01 — Simplicity

The interface should be intentionally simple.

The first add-in is designed to demonstrate:

> One API call → one card → three states.

Therefore, avoid unnecessary controls, navigation, charts, animations, or secondary functionality.

## UX-02 — Readability

Driver information must be easily scannable.

The driver name should have stronger visual hierarchy than secondary information.

## UX-03 — Consistency

All states should use the same overall visual language.

## UX-04 — Empty State

The empty state should look intentional rather than like a failed API request.

## UX-05 — Missing Values

Use `—` consistently for unavailable individual fields.

---

# 13. Technical Architecture

The initial architecture should remain simple.

### Data Flow

```text
Geotab
   ↓
Selected vehicle context
   ↓
state.device.id
   ↓
addin.js
   ↓
Geotab API
   ↓
DriverChange
   ↓
Driver data
   ↓
addin.js
   ↓
index.html
   ↓
Driver Contact Card
```

This matches the data-flow mechanism described in the source material.

---

# 14. Repository Structure

The initial repository should contain four primary files:

```text
/
├── index.html
├── addin.js
├── addin.css
└── config.json
```

### index.html

Responsible for:

* HTML structure.
* Driver card container.
* Loading state.
* Empty state.
* Error state.

### addin.js

Responsible for:

* Reading Geotab context.
* Obtaining vehicle ID.
* Calling the Geotab API.
* Processing the API response.
* Determining the appropriate UI state.
* Updating HTML.
* Handling errors.

### addin.css

Responsible for:

* Card layout.
* Typography.
* Spacing.
* Field styling.
* Empty state.
* Loading state.
* Responsive behavior.

### config.json

Responsible for:

* Registering the add-in with Geotab.
* Defining where the add-in appears.
* Defining the add-in name/configuration.

The four-file responsibility model is explicitly defined in the source specification.

---

# 15. API Requirements

## API Operation

**Operation:** `Get`

## Entity

**typeName:** `DriverChange`

## Search

The request should filter using the selected vehicle/device ID.

### Conceptual Request

```javascript
{
  typeName: "DriverChange",
  search: {
    deviceSearch: {
      id: vehicleId
    }
  }
}
```

### Response Processing

The initial implementation should process the relevant returned driver-assignment record.

The source implementation describes taking the first returned record and passing it to the rendering function.

---

# 16. Data Mapping

The implementation should create a clear mapping between API response fields and UI fields.

Example conceptual model:

```javascript
{
  name: "...",
  phone: "...",
  email: "...",
  license: "..."
}
```

Before rendering:

* Check each field.
* If value exists → display value.
* If value is missing/null/empty → display `—`.

This prevents missing fields from breaking the card.

---

# 17. Security Requirements

The add-in must:

* Use the authenticated Geotab API context.
* Never hard-code API credentials.
* Never expose credentials in JavaScript.
* Never store sensitive authentication information in `config.json`.
* Avoid logging unnecessary personal information.
* Avoid sending driver information to external services.

No external backend is required for Version 1.0.

---

# 18. Performance Requirements

The add-in should:

* Make only the required API request.
* Render promptly after receiving the API response.
* Avoid unnecessary API polling.
* Avoid unnecessary external libraries.
* Avoid blocking the UI while the request is running.

### Performance Target

For a normal successful API response, the card should render as quickly as the Geotab environment and API response permit.

No formal latency SLA is defined in the source specification.

---

# 19. Deployment

The intended development/deployment flow is:

```text
Developer
   ↓
GitHub
   ↓
Vercel deployment
   ↓
Geotab
   ↓
Test
```

The source exercise specifically identifies GitHub → Vercel deployment → testing in Geotab as the development workflow.

### Deployment Requirements

* Repository hosted in GitHub.
* Deployment configured through Vercel.
* Add-in configuration points to the deployed application.
* Add-in tested in the Geotab environment.

---

# 20. Testing Requirements

Testing must cover all primary states.

## Test Case 1 — Assigned Driver

### Given

A vehicle has an assigned driver.

### When

The user opens the add-in.

### Then

The driver's name, phone, email, and license are displayed.

---

## Test Case 2 — Missing Phone

### Given

A vehicle has a driver but phone information is unavailable.

### When

The user opens the add-in.

### Then

The phone field displays:

`—`

---

## Test Case 3 — Missing Email

### Given

A vehicle has a driver but email information is unavailable.

### When

The user opens the add-in.

### Then

The email field displays:

`—`

---

## Test Case 4 — Missing License

### Given

A vehicle has a driver but license information is unavailable.

### When

The user opens the add-in.

### Then

The license field displays:

`—`

---

## Test Case 5 — No Driver

### Given

A vehicle has no assigned driver.

### When

The user opens the add-in.

### Then

The interface displays:

**No driver assigned to this vehicle.**

---

## Test Case 6 — API Failure

### Given

The API request fails.

### When

The add-in receives the error.

### Then

The interface displays a user-friendly error message.

---

## Test Case 7 — Vehicle Context

### Given

The user selects a vehicle.

### When

The add-in initializes.

### Then

The API request uses the selected vehicle's ID rather than a hard-coded ID.

---

# 21. Acceptance Criteria

The add-in is considered complete only when all of the following are true:

### Functional

* [ ] Vehicle ID is successfully retrieved from Geotab context.
* [ ] Geotab `DriverChange` API request is successfully implemented.
* [ ] Driver name can be displayed.
* [ ] Driver phone can be displayed.
* [ ] Driver email can be displayed.
* [ ] Driver license can be displayed.
* [ ] Missing individual values display `—`.
* [ ] No-driver state displays the required empty-state message.
* [ ] API errors are handled visibly.
* [ ] No state results in a blank/broken screen.

### UI

* [ ] Driver card is visually clean.
* [ ] Driver name is clearly identifiable.
* [ ] Contact fields are easy to scan.
* [ ] Missing values are visually consistent.
* [ ] Empty state is clearly distinguishable from an error.
* [ ] Loading state is handled.

### Technical

* [ ] `index.html` contains the UI structure.
* [ ] `addin.js` contains application logic.
* [ ] `addin.css` contains presentation styles.
* [ ] `config.json` registers the add-in.
* [ ] No API credentials are hard-coded.
* [ ] Code is committed to GitHub.
* [ ] Application is deployed through Vercel.
* [ ] Add-in is tested in Geotab.

---

# 22. Definition of Done

The add-in is **Done** only when both of the following conditions are true:

### Working State

A user clicks/selects a vehicle and the driver card appears with:

* Name
* Phone
* Email
* License

### Empty State

A user selects a vehicle with no driver and a clean message appears:

**No driver assigned to this vehicle.**

There must be no crash and no blank screen.

The source specification explicitly defines these two conditions as the completion bar.

---

# 23. Development Milestones

## Milestone 1 — Project Setup

* Create GitHub repository.
* Create four base files.
* Configure basic Geotab add-in structure.
* Configure Vercel deployment.

## Milestone 2 — Geotab Context

* Access Geotab API/add-in context.
* Retrieve `state.device.id`.
* Verify selected vehicle ID.

## Milestone 3 — API Integration

* Implement `DriverChange` API request.
* Process API response.
* Add error handling.

## Milestone 4 — Driver Card

* Build HTML structure.
* Map driver information.
* Style the card.

## Milestone 5 — State Handling

Implement:

1. Assigned driver.
2. Missing driver fields.
3. No driver.
4. API failure.
5. Loading.

## Milestone 6 — Testing

* Test assigned driver.
* Test missing fields.
* Test no driver.
* Test API failure.
* Test multiple vehicles.
* Test deployment.

## Milestone 7 — Production Validation

* Deploy to Vercel.
* Register/configure in Geotab.
* Test in the Geotab environment.
* Confirm acceptance criteria.
* Mark Version 1.0 complete.

---

# 24. Future Enhancements

These are intentionally outside Version 1.0 but may be considered later:

### Phase 2

* Click-to-call phone number.
* Click-to-email email address.
* Driver profile link.
* Driver photo.
* Vehicle information.
* Driver assignment timestamp.
* Last known driver assignment.
* Driver history.

### Phase 3

* Driver assignment management.
* Driver search.
* Driver analytics.
* Communication tools.
* Advanced driver profile.

These features should not be added to Version 1.0 unless requirements change.

---

# 25. Product Success Metrics

For the first release, success should primarily be measured by functionality and reliability rather than usage analytics.

### Minimum Success Criteria

**100%**

of the required UI states are implemented.

**100%**

of missing-field scenarios are handled without crashing.

**100%**

of no-driver scenarios display a meaningful empty state.

**100%**

of API failures produce a visible error state rather than a blank interface.

**100%**

of production deployments use the approved repository/deployment process.

---

# 26. Product Principle

The guiding principle for this add-in is:

> **Keep the first add-in simple: read context, make one API call, handle the result, and render the correct state.**

The source specification emphasizes this four-step mechanism and explicitly warns against building only the successful state.

The implementation should therefore prioritize **correctness, state handling, and understanding of the Geotab add-in architecture over feature quantity.**

---

# 27. Final Release Checklist

* [ ] Repository created.
* [ ] `index.html` created.
* [ ] `addin.js` created.
* [ ] `addin.css` created.
* [ ] `config.json` created.
* [ ] Geotab context successfully accessed.
* [ ] Vehicle ID successfully retrieved.
* [ ] `DriverChange` API implemented.
* [ ] Assigned-driver card implemented.
* [ ] Missing-data state implemented.
* [ ] No-driver state implemented.
* [ ] Loading state implemented.
* [ ] Error state implemented.
* [ ] UI tested.
* [ ] API tested.
* [ ] GitHub commit completed.
* [ ] Vercel deployment completed.
* [ ] Geotab testing completed.
* [ ] Working state verified.
* [ ] Empty state verified.
* [ ] Version 1.0 approved.

---

## 28. One-Sentence Product Definition

**A lightweight Geotab add-in that uses the selected vehicle context and a single `DriverChange` API request to display the assigned driver's contact card while gracefully handling missing data, no-driver assignments, loading, and API errors.**
