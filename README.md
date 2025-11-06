# Wordle Creator

A custom Wordle game creator where you can create your own word puzzles and share them with friends!

## Current Functionality

### Create Mode
- Create custom Wordle puzzles with words between 4-7 letters
- Add hints to help players guess your word
- Words are validated (letters only, correct length)
- All created words are saved locally in your browser

### Play Mode
- View all your created words with their hints
- Select any word to play
- Full Wordle gameplay experience:
  - 6 attempts to guess the word
  - Color-coded feedback:
    - **Green**: Letter is correct and in the right position
    - **Yellow**: Letter is in the word but in the wrong position
    - **Gray**: Letter is not in the word
  - On-screen keyboard with visual feedback
  - Physical keyboard support
  - Smooth tile flip animations
- Delete words you no longer want

### User Interface
- Clean, modern design with custom color palette
- Full-screen responsive layout
- Large, easy-to-read tiles and keyboard
- Intuitive navigation between modes

## Local Storage
All created words are stored in your browser's localStorage, so they persist between sessions on the same device.

## Planned Feature: Share Words (Option 2 - Base64 URL Encoding)

### How It Will Work

#### Creating & Sharing
1. After creating a word, user clicks "Share" button
2. System generates a shareable URL with encoded word data:
   ```
   https://yoursite.com/?play=eyJ3b3JkIjoiQVBQTEUiLCJoaW50IjoiQSByZWQgZnJ1aXQifQ==
   ```
3. User can copy the link and send via:
   - Text message
   - Email
   - Social media
   - Any messaging platform

#### Receiving & Playing
1. Recipient clicks the shared link
2. App automatically detects the `?play=` parameter
3. Decodes the Base64 string to extract word and hint
4. Bypasses word selection and launches directly into the game
5. Player can attempt to solve the shared word

### Technical Implementation Plan

#### Frontend Changes Needed

**1. Add Share Button (Create Mode)**
- Add "Share Word" button after successfully saving a word
- Generate Base64 encoded string: `btoa(JSON.stringify({word, hint}))`
- Display shareable link in a modal/popup
- Add "Copy to Clipboard" functionality

**2. Add Share Button (Word List)**
- Add "Share" button next to each word card
- Same encoding logic as above
- Allows sharing previously created words

**3. URL Parameter Detection (On Page Load)**
```javascript
// Check for ?play= parameter on page load
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('play')) {
    const encodedData = urlParams.get('play');
    try {
        const decoded = JSON.parse(atob(encodedData));
        // Validate decoded data
        if (decoded.word && decoded.hint) {
            // Start game directly with this word
            startGame(decoded);
            // Hide mode selection
            // Show game area immediately
        }
    } catch (error) {
        // Show error message for invalid links
    }
}
```

**4. UI Updates**
- Add share icon/button styling
- Create modal/dialog for displaying shareable link
- Add "Copy Link" button with success feedback
- Show error message for invalid/corrupted share links

### Benefits of This Approach
- ✅ No backend required - works immediately
- ✅ Works across devices and browsers
- ✅ Simple to implement
- ✅ Can share via any communication method
- ✅ Unlimited word/hint combinations
- ✅ Links never expire

### Limitations
- ⚠️ Word is technically visible if someone inspects the URL/decodes it
- ⚠️ Very long hints might create very long URLs
- ⚠️ No tracking of how many people played your word
- ⚠️ No leaderboard or statistics across users

### Future Enhancements (Beyond Option 2)
- Add backend database for truly private sharing
- Track play statistics (attempts, success rate)
- Daily challenge mode
- Leaderboards
- Social features (like, comment, rate words)
- Custom categories/tags for words
- Multiplayer racing mode

## Technologies Used
- HTML5
- CSS3
- Vanilla JavaScript
- LocalStorage API
- (Future: Base64 encoding for sharing)

## Installation
1. Clone or download this repository
2. Open `index.html` in a web browser
3. No build process or dependencies required!

## Browser Compatibility
Works in all modern browsers that support:
- LocalStorage
- CSS Grid
- ES6 JavaScript
- (Future: URL API, Base64 encoding)