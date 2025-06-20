# AI Report Generation Feature

## Overview

The AI Report Generation feature provides intelligent analysis of your raid performance data using free AI services like Hugging Face and Google Gemini. It automatically identifies key insights and generates professional reports for raid leaders.

## Features

### Automatic Insight Detection
- **Performance Improvements**: Identifies players with >15% performance gains
- **Performance Declines**: Flags players with >15% performance drops  
- **Low Attendance**: Highlights players with <70% attendance rates
- **Severity Classification**: Categorizes insights as High, Medium, or Low priority

### AI-Generated Reports
- Professional raid performance summaries (200-300 words)
- Key recommendations for raid leaders
- Overall raid progression analysis
- Player-specific insights and concerns

## How to Use

### 1. Prerequisites
- You need at least **2 saved raid analyses** with timeline data
- A free API key from either Hugging Face or Google

### 2. Access the Feature
1. Go to the **Hub Page** (main dashboard)
2. Look for the **"AI Report Generator"** card in the Quick Actions section
3. Click **"Generate AI Report"** button

### 3. Configure AI Provider
1. Select your preferred AI provider:
   - **Hugging Face (Free)**: Get your free API key at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
   - **Google Gemini (Free)**: Get your free API key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Enter your API key (stored only for the session)
3. Click **"Generate AI Report"**

### 4. Review Generated Report
- **AI Summary**: Professional analysis of raid progression and trends
- **Key Insights**: Automatically detected performance and attendance issues
- **Copy Report**: Export the full report to clipboard for sharing

## What Gets Analyzed

### Performance Metrics
- Player performance changes over time
- Raid-wide progression trends
- Top performers and concerning players
- Overall raid improvement/decline patterns

### Attendance Tracking
- Player participation rates across raids
- Attendance consistency analysis
- Impact of roster changes

### Insight Categories

#### Performance Improvements (🔼)
- Players showing >15% performance gains
- Consistent upward trends
- Notable skill development

#### Performance Declines (🔽)  
- Players with >15% performance drops
- Concerning downward trends
- Players needing attention

#### Low Attendance (👥)
- Players attending <70% of raids
- Roster stability concerns
- Potential recruitment needs

## Example Report Output

```
RAID PERFORMANCE REPORT
Generated: 12/15/2024
Analysis Period: Nov 1, 2024 to Dec 15, 2024
Reports Analyzed: 8

The raid team has shown steady improvement over the 8-week analysis period, with an overall 
performance increase of 12%. Notable highlights include exceptional growth from several key 
players and improved consistency across all roles.

Key strengths include strong DPS performance averaging 87% and excellent healing coordination. 
However, attendance concerns with 3 players below 70% participation may impact future 
progression. Recommend addressing roster stability and continuing current improvement strategies.

KEY INSIGHTS:
• Significant Performance Improvement: Shadowmage (Fire Mage) improved by 23% from 67% to 90%
• Significant Performance Improvement: Healbot (Holy Priest) improved by 18% from 72% to 90%
• Low Attendance Rate: Absentplayer (Protection Warrior) attended only 4/8 raids (50%)
```

## Technical Details

### Data Sources
- Uses existing Timeline Analysis data
- Leverages chronological raid progression tracking
- Analyzes player performance trends and attendance patterns

### AI Integration
- **Hugging Face**: Completely free inference API with various models
- **Google Gemini**: Free tier with generous limits and fast responses
- **Session-only storage**: API keys are never permanently stored

### Security
- API keys stored only in browser memory during session
- No server-side storage of sensitive credentials
- Direct API calls from frontend (will be moved to backend later)

## Troubleshooting

### "Need at least 2 reports" Error
- Import more raid reports to enable timeline analysis
- Ensure reports have valid date/time data

### API Key Errors
- Verify your API key is correct and active
- Check you have available credits/quota
- Ensure you're using the right provider format

### No Timeline Data Available
- Make sure you've run Timeline Analysis on your reports
- Verify reports are properly imported and processed

## Future Enhancements

### Planned Features
- Backend API integration for secure key storage
- More detailed performance metrics analysis
- Boss-specific insights and recommendations
- Historical trend comparisons
- Custom insight thresholds
- PDF report generation
- Automated report scheduling

### Additional Metrics
- Class/spec performance analysis
- Encounter-specific insights
- Gear progression tracking
- Consumable usage patterns
- Death analysis and positioning insights

## Support

If you encounter issues with the AI Report feature:
1. Check that you have sufficient timeline data (2+ reports)
2. Verify your API key is valid and has available quota
3. Ensure your internet connection is stable for API calls
4. Try switching between Hugging Face and Google Gemini if one provider fails 