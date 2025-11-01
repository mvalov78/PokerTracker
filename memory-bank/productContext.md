# PokerTracker Product Context

## Product Overview
PokerTracker is a web application designed for poker players to track and analyze their tournament results. The application helps players maintain records of their poker tournaments, calculate profitability, and gain insights into their performance through analytics.

## User Personas

### Primary Persona: Recreational Poker Player
- Plays 2-5 poker tournaments per week
- Wants to track results to improve game
- Uses mobile device frequently to check stats
- Prefers quick data entry methods
- Values visual representation of performance

### Secondary Persona: Semi-Professional Player
- Plays 10+ tournaments per week
- Needs detailed analytics for decision making
- Requires bankroll management features
- Uses both mobile and desktop interfaces
- Wants to export data for external analysis

### Admin Persona
- Manages the application settings
- Configures Telegram bot settings
- Troubleshoots user issues
- Monitors system performance

## Key Features

### 1. Tournament Tracking
- Register new tournaments manually or via Telegram bot
- Track buy-ins, payouts, and profit/loss
- Categorize tournaments by venue and structure
- Add notes and photos of tournament tickets
- View tournament history and details

### 2. Results Analysis
- Calculate ROI, profit/loss statistics
- View performance trends over time
- Filter results by venue, tournament type
- Generate performance reports
- Track bankroll growth/decline

### 3. Telegram Bot Integration
- Register tournaments by sending photos of tickets
- Quick commands to check stats on the go
- Receive reminders about upcoming tournaments
- Get notifications about bankroll changes
- Access basic analytics via chat commands

### 4. User Profile & Settings
- Personal dashboard with summary statistics
- Preferences for notifications and display options
- Connect/disconnect Telegram account
- Currency settings for international users
- Privacy settings for data sharing

### 5. Bankroll Management
- Track deposits and withdrawals
- Monitor bankroll fluctuations
- Set bankroll goals and limits
- Receive warnings for bankroll risk
- View bankroll allocation across venues/games

## User Flows

### Tournament Registration Flow
1. User selects "Add Tournament" option
2. User enters tournament details (name, buy-in, date, venue)
3. Optional: User uploads photo of tournament ticket
4. System confirms tournament creation
5. User receives confirmation

### Tournament Result Entry Flow
1. User selects tournament from list
2. User enters position, payout amount
3. System calculates profit/loss and ROI
4. User adds optional notes about performance
5. System updates statistics and dashboard

### Telegram Bot Registration Flow
1. User starts conversation with bot
2. Bot prompts for authorization code
3. User enters code from web interface
4. Accounts are linked
5. User can now use bot commands

### Analytics Review Flow
1. User navigates to Analytics section
2. User selects timeframe and metrics
3. System generates visual reports
4. User can drill down into specific data points
5. User can export or share results

## Business Goals

### Primary Goals
1. Help poker players improve their game through data-driven insights
2. Provide an easy-to-use platform for tournament tracking
3. Enable quick data entry through mobile and bot interfaces
4. Deliver valuable analytics that inform player decisions
5. Create a sustainable product with potential premium features

### Success Metrics
1. User engagement (weekly active users)
2. Tournament entries per user
3. Bot usage statistics
4. Feature adoption rates
5. User retention over time

## Development Priorities

### Current Phase (v1.4.0)
- Stabilize Telegram bot integration
- Improve OCR functionality for ticket scanning
- Enhance analytics visualizations
- Fix critical bugs and improve performance
- Add comprehensive test coverage

### Future Roadmap
- Advanced bankroll management features
- Social features (friends, leaderboards)
- Premium subscription tier
- Mobile native app
- Export functionality to various formats
- Multi-language support

## User Experience Principles

1. **Simplicity First** - Make common tasks quick and easy
2. **Mobile-Optimized** - Ensure great experience on all devices
3. **Quick Data Entry** - Minimize friction for adding tournaments/results
4. **Meaningful Insights** - Provide actionable analytics
5. **Seamless Integration** - Bot and web app should work together flawlessly

## Competitive Landscape

### Direct Competitors
- Poker Income Tracker
- Poker Journal
- Poker Bankroll Tracker

### Key Differentiators
1. Telegram bot integration for quick entry
2. OCR capabilities for ticket scanning
3. Clean, modern interface
4. Focus on tournament-specific analytics
5. Multi-platform support (web, mobile, bot)
