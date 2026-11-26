# Add Subscription to the menu

- Add a "Subscription" link (crown icon) to the top menu, after "Students AI", visible to everyone (signed in or not).
- Add it to the mobile bottom bar too, between "AI Tools" and "Dashboard".

## Technical
- `src/components/Layout.tsx`: add `{ path: "/subscription", label: "Subscription", icon: Crown }` to the main nav list and the mobile bottom nav list; import `Crown` from lucide-react.
