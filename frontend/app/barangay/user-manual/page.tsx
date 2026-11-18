"use client"

import { useEffect, useState } from "react"
import IntroScreen from "./components/IntroScreen"
import ManualIntro from "./components/ManualIntro"
import SearchBar from "./components/SearchBar"
import TopicTabs from "./components/TopicTabs"
import StepsList, { ManualStep } from "./components/StepList"
import StepDetail from "./components/StepDetails"
import GuidedTour, { TourStep } from "./components/GuidedTour"

const SEEN_TOUR_KEY = "agos-manual-tour-seen"

const TOUR_STEPS: TourStep[] = [
  { target: "search", title: "Search the manual", description: "Type a word or phrase to find it anywhere in the manual.", placement: "bottom" },
  { target: "topics", title: "Topics", description: "Switch between sections of the system here. Some tabs open a dropdown of sub-topics.", placement: "bottom" },
  { target: "steps", title: "Steps", description: "Each topic is broken into steps. Visited steps are marked as you go.", placement: "right" },
  { target: "detail", title: "Step details", description: "The full instructions, images, and the reason each step matters appear here.", placement: "left" },
  { target: "nav", title: "Previous and Next", description: "Move through the manual one step at a time.", placement: "bottom" },
]




interface ManualSubTopic {
  id: string
  label: string
  steps: ManualStep[]
}

interface ManualTopic {
  id: string
  label: string
  steps?: ManualStep[]
  subTopics?: ManualSubTopic[]
}

const TOPICS: ManualTopic[] = [
  {
    id: "login",
    label: "Login",
    steps: [
      {
        id: "login-overview",
        label: "Login Overview",
        description: "This is page is the entry point to the AGOS web dashboard, where the barangay personnel enters their registered email and password to access the system. A “Forgot Password?” link is also provided for account recovery.",
        whyItMatters: "This is important because it is the first step of the guided tutorial, and it introduces new barangay personnel to the login page before they use it. Knowing where to enter their email and password, and where to find “Forgot Password?”, helps them access the AGOS dashboard confidently and recover their account on their own if needed.",
        images: ["/admin-manual/login/login-overview.png"],
      },
      {
        id: "login-cont",
        label: "Login User Credentials",
        description: "The login form consists of two fields: the Email field, where the barangay personnel enters their registered email address, and the Password field, where the barangay personnel enters their account password.",
        whyItMatters: "These login features help the administrator access the system securely. The Email and Password fields verify that only authorized users can enter, the hide/unhide option helps prevent typing errors while keeping the password private, the error message alerts the barangay personnel to incorrect credentials, and the Login button submits the details before the Data Privacy Notice and dashboard access.",
        images: ["/admin-manual/login/login-credentials.png"],
        extraSections: [
          {
            label: "Hide | Unhide password",
            description: " The password field includes an eye icon that toggles visibility, allowing the barangay personnel to show or hide the entered characters before logging in.",
            images: ["/admin-manual/login/login-hide-unhide.png"],
          },
          {
            label: "Incorrect Email | Password",
            description: "If the barangay personnel enters an incorrect email or password, both fields turn red and the message “Email or password is incorrect. Check your credentials and try again.” appears.",
            images: ["/admin-manual/login/login-errorlogin.png"],
          },
          {
            label: "Login Button",
            description: "Submits the entered email and password to authenticate the barangay personnel. If the credentials are correct, a Data Privacy Notice is shown next before the barangay personnel is granted access to the dashboard.",
            images: ["/admin-manual/login/login-loginbtn.png"],
          },
        ],
      },
      {
        id: "data-privacy",
        label: "Data Privacy Notice",
        description: "For new users, this is shown after logging in with valid credentials, presenting the purpose of personal data collection and the user's rights as a data subject under Section 16 of the Data Privacy Act. The barangay personnel must check the consent box confirming they have read and understood the notice before clicking “Proceed”.",
        whyItMatters: "The Data Privacy Notice is important because it makes sure barangay personnel know how their personal data is collected and used, and what their rights are as data subjects under the Data Privacy Act. Requiring the consent box to be checked before clicking “Proceed” gives the system a record that the barangay personnel read and agreed to the notice, which helps the LGU stay compliant with data privacy law.",
        
      },
      {
        id: "change-pword",
        label: "Change Password",
        description: "After clicking “Proceed” in the Data Privacy Notice, this is modal is shown, requiring them to set a new password before proceeding into the system. \n\nThe admin enters their current (temporary) password, then a new password and its confirmation, each with a visibility toggle.",
        whyItMatters: "Setting a new password is important because the temporary password is known to someone other than the barangay personnel. Requiring a change ensures that only the barangay personnel knows the credentials. The real-time checklist helps create a strong password, and the confirmation message and “Go to Login” button show that the change was saved and guide the barangay personnel to sign in with the new password.",
        
        extraSections: [
          {
            label: "Current Password For New User",
            description: "This is where the user enters their existing (temporary) password issued upon account creation.",
            
          },
          {
            label: "New | Confirm Password",
            description: "Where the user enters their desired new password and confirm it. \n\n The new password must meet the requirements — at least 8 characters, one special character, matching entries, and being different from the current password — are validated in real time via checklist indicators. Clicking “Change Password” submits the update.",
            
          },
          {
            label: "Updating Password Dialog",
            description: "A loading indicator is shown after clicking “Change Password”, confirming that the system is securely processing and saving the new password.",
            
          },
          {
            label: "Changed Password Modal",
            description: "This is a confirmation that the password has been successfully updated and prompts the user to log in again using their new credentials. \n\n Clicking “Go to Login” returns the user to the Login page and enter their email and new password.",
            
          },
        ],
      },
      {
        id: "login-forgot-pass",
        label: "Forgot Password",
        description: "Clicking the “Forgot Password?” link on the Login page starts the account recovery process, which lets the barangay personnel verify their identity and reset their password.",
        whyItMatters: "This step allows barangay personnel who have forgotten their password to regain access to their account without needing to contact support, while keeping the account secure.",
        images: ["/admin-manual/login/login-forgotpassword.png"],
        extraSections: [
          {
            label: "Enter Email",
            description: "The barangay personnel enters their registered email address and submits it. A verification code is then sent to that email.",
          },
          {
            label: "Enter Verification Code",
            description: "The admin enters the code sent to the email they provided. Once the code is verified, they can proceed to set a new password.",
          },
        ],
      },
      
    ],
  },{
    id: "sidebar",
    label: "Sidebar Navigation",
    steps: [
      {
        id: "sidebar-overview",
        label: "Sidebar Navigation Overview",
        description: "The main navigation panel present throughout the AGOS web dashboard, providing quick access to all primary modules: Map, Alerts, Aanalytics, Readings, Barangay Reports, and Help. It also displays the currently logged-in barangay personnel name and role at the bottom, along with a logout button.",
        
        whyItMatters: "The sidebar navigation is important because it gives the barangay personnel quick, consistent access to all main modules of AGOS from any page, which saves time and makes the system easier to use. It also shows the logged-in barangay personnel's name and role, and provides a logout button so the session can be ended securely.",
      },
      {
        id: "sidebar-title",
        label: "System Logo and Title",
        description: "Located at the top of the sidebar navigation, above the menu items, the AGOS logo and system title identify the platform the barangay personnel is using. They remain visible on every page of the system, helping the barangay personnel confirm that they are in the Automated Geospatial Canal Obstruction Sensing System.",
        
        whyItMatters: "The system logo and title are important because they clearly identify the platform the barangay personnel is using. Since they stay visible at the top of the sidebar on every page, they confirm that the barangay personnel is working in AGOS and give the dashboard a consistent, professional look.",
      },
      {
        id: "sidebar-items",
        label: "Sidebar Items",
        description: "Click any menu item in the sidebar to navigate to that module's page; the active page is highlighted to show your current location.",
        
        whyItMatters: "The sidebar items are important because they let the barangay personnel move between modules with a single click, while the highlighted active page shows the current location in the system. ",
        
      },
      {
        id: "user-profile",
        label: "User Panel",
        description: "Displays the name and role (e.g., “Barangay Personnel”) of the currently logged-in user at the bottom of the sidebar, along with a logout icon for ending the session.",
        
        whyItMatters: "The user panel is important because it shows which account is currently signed in and its role, so the barangay personnel can confirm they are using the correct account. The logout icon also lets the barangay personnel end the session securely, especially when using a shared or public device.",

      },
    ],
  },
  {
   id: "top-bar" ,
   label: "Top Bar",
   steps:[
    {
      id:"top-bar-overview",
      label:"Top Bar Overview",
      description: "Displayed across the top of every page, it shows the title of the current module (e.g., “Map”) on the left and the notification bell on the right.",
      
      whyItMatters: "The top bar is important because it shows the title of the current module, so the barangay personnel always knows which page they are on. The notification bell on the right gives quick access to alerts and updates from any page, helping the barangay personnel notice and respond to important events without leaving their current task.",
    },
    {
      id: "tab-bar-title",
      label: "Module Title",
      description: "Displayed on the left side of the top header bar, it shows the name of the module the barangay personnel is currently viewing (e.g., “Map”), helping them confirm their location within the system.",
      
      whyItMatters: "The module title is important because it clearly shows which page the barangay personnel is currently viewing. This helps them confirm their location in the system, avoid confusion when switching between modules, and ensure they are working in the right section before taking any action.",
    },
    {
      id:"notif-bell",
      label:"Notification Bell",
      description: "Located on the right side of the top header bar, it alerts the barangay personnel to new sensor readings and reports submitted by barangay personnel. A red badge shows the number of unread notifications. \n\nClicking the bell opens a dropdown of recent notifications.",
      
      whyItMatters: "The notification bell is important because it keeps the barangay personnel informed of new sensor readings and barangay reports without leaving their current page. The red badge shows how many notifications are unread, “Mark all as read” clears the badge once everything has been reviewed, and dimmed read notifications make it easy to tell which ones still need attention. The “See all alerts” link leads to the Alerts module for full details, while the “You’re all caught up” message confirms that there is nothing pending, helping the barangay personnel respond to canal issues quickly.",
      extraSections: [
        {
          label: "Mark all as read",
          description:"Located at the top right of the Notifications dropdown; clicking it marks all notifications as read and clears the unread count badge on the notification bell.",
          
        },
        {
          label: "Read Notification",
          description:"Notifications that have already been read appear dimmed in the list, allowing the admin to easily distinguish them from unread notifications, which are displayed in full color.",
        
        },
        {
          label: "See all alerts",
          description:"Located at the bottom of the Notifications dropdown; Clicking “See all alerts” navigates the admin to the Alerts module for a full, detailed view.",
          
        },
        {
          label: "“You’re all caught up” Message",
          description: "Displayed in the Notifications dropdown when there are no new notifications, indicating the admin has no pending alerts or reports to review.",
          
        },
        
      ]
    },
    
    {
      id: "notif-bell-sensor",
      label: "Sensor Notification",
      description: "Opens when a sensor reading alert is clicked from the Notifications dropdown, showing the alert type, the node ID, barangay, and date and time detected. The details section displays the dominant waste type, estimated volume, and confidence score, along with the composition breakdown of recyclable, biodegradable, residual, and special waste. \n\nClicking the close button (×) dismisses the modal.",
      
      whyItMatters: "The Sensor Notification modal is important because it gives the barangay personnel a quick overview of a sensor alert without leaving the current page. It shows which node and barangay detected the issue and when, along with the dominant waste type, estimated volume, confidence score, and waste composition breakdown. This helps the administrator judge how serious the obstruction is and decide whether action is needed, while the close button (×) lets them dismiss the modal and continue working.",
    },
   ]
   
  },
  {
    id: "map",
    label: "Map",
    steps: [
      {
        id: "map-overview",
        label: "Map Overview",
        description: "-",
        
        whyItMatters: "-",
      },
      {
        id: "dashboard-summary-cards",
        label: "Summary Cards",
        description: "-",
        
        whyItMatters: "-",
        extraSections: [
          {
            label: "-",
            description: "- ",
            
          },
          
        ],
      },
      {
        id: "local-net-map",
        label: "Localized Canal Map",
        description: "-",
        whyItMatters: "-",
        
        extraSections: [
          {
            label: "Map View Toggle",
            description: "Lets the barangay personnel switch the canal map's display between “Map” (standard street map) views and “Sat” (satellite imagery).",
            
          },
          {
            label: "Clicking a Node",
            description: "Clicking a sensor node on the map enables the user to view its node name, location, water level, and clog percentage",
            
          },
          {
            label: "Zoom In | Zoom Out",
            description: "Zoom In: Click the Plus (+) button to zoom in on the map. This allows users to view the canal network and sensor locations in greater detail and at a closer scale. \nZoom Out: Click the Minus (-) button to zoom out of the map. This allows users to view a wider area of the canal network and surrounding locations at a larger scale.",
            
          },
          {
            label: "Map Risk Level Legend",
            description: "Live Risk Level legend uses color-coded labels to help users quickly identify the condition and priority level of each monitored location. \n\nGray - Sleep Mode: Indicates that the sensor node is currently inactive or in sleep mode and is not actively monitoring the canal. \nBlue - Normal: Indicates that the canal is operating under normal conditions, with no immediate risk detected. \nOrange - Warning: Indicates that an unusual or potentially hazardous condition has been detected. Users should monitor the location and consider taking preventive action. \nRed - Critical: Indicates a high-risk or potentially severe canal condition that requires immediate attention and appropriate intervention. \nPurple - Under maintenance: Indicates that the sensor device is undergoing a maintenance.",
            
          },
          
          
        ],
      },
      
      
    ],
  },
  {
    id: "alerts",
    label: "Alerts",
    steps: [
      {
        id: "alert-notif",
        label: "Alert Notification Overview",
        description: "This provides a centralized view of system notifications and detected events from sensor nodes.",
        whyItMatters: "The Alerts page is important because it gives the barangay personnel one place to review all system notifications and events detected by the sensor nodes. This makes it easier to track what has happened, spot problems that need attention, and respond quickly without checking each module separately.",
        images: ["/barangay-manual/alerts/alerts-overview.jfif"],
      },
      {
        id: "search-filter-alert", 
        label: "Search and Filter Notification",
        description: "Users can search notifications and and filter it by date, ",
        whyItMatters: "The search and filter tools are important because they help the barangay personnel quickly find relevant alerts. Filtering the date range, and alert type lets the barangay personnel focus on a specific area, time period, or issue instead of reviewing every notification.",
        images: ["/barangay-manual/alerts/alerts-search.jfif", "/barangay-manual/alerts/alerts-filter-date.jfif"],
        extraSections: [
          
          {
            label: "Notification Filter",
            description: "These filtering tabs are used to select specific alert types to bedisplayed on the table such as Water Level Rising, Low/Moderate/Critical Clog, Node Offline, Low Battery, Weak Signal, and Sensor Failure.",
            images: ["/barangay-manual/alerts/alerts-table-filtertabs.jfif"],
          },
        ],
      },
      {
        id: "notif-tbl",
        label: "Notification Table",
        description: "Lists all alerts received by the system, showing the node ID, alert type, barangay, and date and time detected for each entry. Alert types are color-coded for quick identification, such as Report Submitted (green), Low Clog Detected (yellow), Water Level Rising (blue), and Critical Clog Detected (red).",
        whyItMatters: "The Notification Table is important because it lists all alerts in one place, showing the node ID, alert type, barangay, and time detected. The color-coded alert types help the barangay personnel spot urgent issues quickly, dimmed read notifications show which ones have already been reviewed, and the pagination controls make it easy to browse through longer lists without losing track of entries.",
        images: ["/barangay-manual/alerts/alerts-table.jfif"],
        extraSections: [
          {
            label: "Pagination Controls",
            description: "Located at the bottom of the table, they show the current page number and total number of pages (e.g., “Page 1 of 3”). Clicking “Next” moves to the following page of entries, while clicking “Previous” returns to the prior page; a button appears dimmed when there is no page in that direction.",
            images: ["/barangay-manual/alerts/alerts-table-pagecontrol.jfif"],
          },
        ],
      },
      
    ],
  },
  {
    id:"analytics",
    label:"Analytics",
    steps: [
      {
        id: "analytics-overview",
        label: "Analytics Overview",
        description: "The Waste Analytics page summarizes the waste detected by the sensor nodes within a selected date range. It shows summary cards for total detections, active hotspots, total waste, critical areas, and clear nodes, along with the latest debris reading per node, the percentage of each waste type, and a table of all waste classification readings. The Export button saves the data for reporting.",
        whyItMatters: "The Waste Analytics page is important because it turns raw sensor readings into clear information that barangay personnel can act on. By showing how much waste is detected, what types it is, and which nodes or areas are critical or clear, it helps them decide where to send clean-up teams and which canals need attention first. The waste type breakdown also helps identify common sources of clogging, such as biodegradable or recyclable waste, which can guide waste management and awareness efforts. The Export button lets personnel save this data for reports and for planning with the LGU.",
        images: ["/barangay-manual/analytics/analytics-overview.jfif"],
      },
      {
        id: "analytics-summary-cards",
        label: "Summary Cards",
        description: "The summary cards give a quick overview of the current sensor data, showing the total detections, active hotspots, total waste, critical areas, and clear nodes.",
        whyItMatters: "The summary cards matter because they give barangay personnel a quick snapshot of the canal situation without having to read through the full table. The total detections and total waste show how much activity the sensors have recorded, while the critical areas and clear nodes show right away which locations need attention and which are fine. This helps personnel decide where to prioritize clean-up and whether any follow-up is needed.",
        images: ["/barangay-manual/analytics/analytics-summaarycards.jfif"],
      },
      {
        id: "analytics-date-filter",
        label: "Filter Date",
        description: "The From and To date fields at the top-left of the Waste Analytics page set the period of data to review. Selecting a start and end date updates the waste type breakdown and the Waste Classification Readings table to show only the readings recorded within that range. The summary cards are not affected by this filter. The selected dates are also used when exporting the data.",
        whyItMatters: "The date range filter is important because it lets barangay personnel focus on the specific period they need, such as a week or a month, instead of going through every reading ever recorded. This makes it easier to see how waste types change over time, review what happened around a particular clogging incident, and prepare reports for a set period. Since the selected dates are also used when exporting, the saved data matches exactly what personnel need to submit or discuss with the LGU.",
        images: ["/barangay-manual/analytics/analytics-date-filter.jfif"],
      },
      {
        id: "analytics-solid-debris",
        label: "Solid Debris Detected",
        description: "The Solid Debris Detection panel shows the latest reading from each sensor node. Each entry displays the node name, the canal hotspot where it is installed (e.g., CN-Poblacion West-2), the date and time of the reading, and its status. A green Clear label with “No detection” means no solid debris was found in the canal at the time of the last reading.",
        whyItMatters: "The Solid Debris Detection panel is important because it shows the current condition of each canal at a glance, based on the latest reading from every sensor node. Barangay personnel can immediately see which nodes detect debris and which are clear, so they know where to send clean-up teams and can skip areas that need no action. It also shows when each reading was taken, which helps personnel judge whether the information is recent or whether a node may have stopped reporting.",
        images: ["/barangay-manual/analytics/analytics-soliddebrisdetection-container.jfif"],
      },
      {
        id: "analytics-classified-waste",
        label: "Classified Waste Type",
        description: "The Classified Waste Type panel shows the share of each waste category detected by the sensor nodes within the selected date range. Biodegradable, recyclable, residual, and special waste are each shown with a color-coded bar and a percentage, so the most common type of waste can be seen at a glance. This panel follows the date range filter, so the percentages update when the From and To dates are changed.",
        whyItMatters: "The Classified Waste Type panel is important because it shows what kinds of waste are most common in the canals. In the example, biodegradable waste makes up the largest share. Knowing this helps barangay personnel identify the main sources of clogging and plan the right response, such as stronger segregation, clean-up drives, or awareness campaigns aimed at the most common waste type. Because it follows the date range filter, it also lets personnel compare waste patterns across different periods.",
        images: ["/barangay-manual/analytics/analytics-classificationwastetype-container.jfif"],
      
      },
      {
        id: "analytics-waste-readings",
        label: "Waste Classification Readings",
        description: "This table lists every waste reading recorded by the sensor nodes within the selected date range. Each entry shows the node, dominant waste type, percentage of each waste category, confidence score, estimated volume, and timestamp.",
        whyItMatters: "The Waste Classification Readings table is important because it keeps the full detail behind the summary panels, letting barangay personnel verify totals, review specific incidents, and check how reliable each reading is. The pagination controls keep the many readings easy to browse by splitting them into pages, so personnel can move through the records without losing their place.",
        images: ["/barangay-manual/analytics/analytics-wasteclassificationreadings-table.jfif"],
        extraSections: [
          {
            label: "Pagination Controls",
            description: "Located at the bottom of the Waste Classification Readings table, the pagination controls show the current page and the total number of pages (e.g., “Page 1 of 12”). Click Next to move to the following page of readings, or Previous to return to the prior page. A button appears dimmed when there is no page in that direction.",
            images: ["/barangay-manual/analytics/analytics-wasteclassificationreadings-table-paginationcontrols.jfif"],
          }
        ]
      },
      {
        id: "analytics-export",
        label: "Export and Download",
        description: "The Export button is located at the top-right of the Waste Analytics page. Clicking it saves the waste data for the selected date range, so it can be used for reports and record keeping.",
        whyItMatters: "The Export button is important because it lets barangay personnel save the waste data outside the system. Having a copy of the readings for the selected date range makes it easier to prepare reports, submit records to the LGU, and keep documentation for planning or review. It also means the data can be shared or checked even without access to the dashboard.",
        images: ["/barangay-manual/analytics/analytics-export-btn.jfif","/barangay-manual/analytics/analytics-export-document.jfif"],
        
      },
    ]
  },
  {
    id: "clog-events",
    label: "Clog Events",
    steps: [
      {
        id: "clog-events-overview",
        label: "Clog Events Overview",
        description: "Tracks canal obstruction incidents detected by the system, showing summary metrics such as Total Clog Events, Cleared Events, Average Resolution Time, and Monthly Completed Events, along with a searchable and filterable table by Barangay and Severity listing each event's ID, Severity, Detected/Resolved timestamps, Location, Water Level, Water Flow, and Status.",
        whyItMatters: "-",
        
      },
      {
        id: "clog-events-summary-cards",
        label:"Summary Cards",
        description: "Displayed at the top of the Clog Events tab, these cards give a quick overview of clog activity for the selected period: Total Clog Events shows the overall number of detected clog events, Cleared Events shows how many have been resolved, Average Resolution Time shows the average time taken to resolve clog events, and Monthly Completed Events shows the number of events completed during the selected month.",
        whyItMatters: "Placeholder — explain why the detail view matters.",
      
      },
      {
        id: "search-filter-clog-events",
        label: "Search and Filter Clog Events",
        description: "Users can use the Search clog event bar to quickly find a specific event, or the All Barangay, All Severity(low, medium, high), All Status(detected, cleared), and Date dropdowns to filter results by location and severity, both can be combined to narrow the list further.",
        whyItMatters: "Placeholder — explain why the detail view matters.",
       
        extraSections: [
          {
            label: "Filters",
            description: "These dropdowns narrow the displayed events. The Barangay filter lists the registered barangays, the Severity filter lets the admin choose Low, Medium, or High, and the Status filter lets the admin choose Detected or Cleared. The Month filter limits the events to a selected month, or shows all months when “All Months” is chosen.",
            
          },
        ],
      },
      {
        id: "clog-events-tbl",
        label: "Clog Events Table",
        description: "Lists the clog events detected by the system, showing each event’s ID, severity, the date and time it was detected and resolved, its location (barangay), the water level and water flow readings at the time, its status, and the reason for its resolution. Severity is color-coded for quick identification: Low (green), Medium (yellow), and High (red). \n\nEvents that are still being addressed have a status of “Detected” and no resolution date, while resolved events show a status of “Cleared.”",
        whyItMatters: "Placeholder — explain why the detail view matters.",
        
      },
      {
        id: "clog-event-details",
        label: "Event Details",
        description: "Displayed on the right side of the Clog Events tab, this panel shows the full details of the clog event selected in the table. \n\nAt the top, it shows the event’s ID, its type and severity, and a color-coded severity badge. The Event Information section lists the location (barangay), the date and time detected, the sensor node that detected it, and the waste classification. The Incident Details section lists the water level and water flow readings, the severity, and the current status of the event.",
        whyItMatters: "Placeholder — explain why the detail view matters.",
        
        extraSections: [
          {
            label: "Event Details Panel (Empty State)",
            description: "When no clog event has been selected in the table, the panel displays a “No Event Selected” message prompting the admin to select a record from the table to view its details.",
             
          },
        ],
      },
      {
        id: "export-clog-event",
        label: "Export and Print",
        description: "Located at the top right of the Clog Events tab, it allows the admin to download the clog events table as a file for record-keeping or reporting and is ready for printing. The exported data reflects the filters currently applied, such as barangay, severity, status, and month.",
        
        whyItMatters: "Placeholder — explain why the detail view matters.",
        extraSections: [
          {
            label: "-",
            description: "-",
          },
        ],
      },
    ]
  },
  {
    id: "brgy-reports",
    label: "Barangay Reports",
    steps: [
      {
        id: "brgy-monthly-reports-overview",
        label: "Barangay Monthly Reports Overview",
        description: "The Barangay Reports module allows the barangay personnel to -",
        whyItMatters: "Placeholder — explain why monthly reports matter.",
        
      },  
      {
        id: "search-filter-brgy-monthly-report",
        label: "Search and Filter Monthly Report",
        description: "-",
        whyItMatters: "Placeholder — explain why monthly reports matter.",
        
      },
      {
        id: "reports-tbl",
        label: "Barangay Monthly Report Table",
        description: "This table lists individual barangay report submissions, showing the date submitted, the barangay, purok, severity, who submitted it, and additional actions actions.",
        whyItMatters: "Placeholder — explain why monthly reports matter.",
        
      },
      {
        id: "view-report",
        label: "View Report",
        description: "Opens after clicking the “View” button on a report in the Barangay Reports table, showing the full report submitted by barangay personnel. The header displays the barangay and purok with a color-coded severity badge, along with a back arrow that returns to the reports table.",
        whyItMatters: "Placeholder — explain why monthly reports matter.",
        
        extraSections: [
          {
            label: "Report Details",
            description: "The Report Details tab presents the report as an official Canal Monitoring Report of the Municipal Environmental and Natural Resources Office, including the report number and the personnel who created it. It is divided into sections such as Monitoring Site Information, which lists the purok, barangay, city/municipality, and province, and Detection Summary, which lists the date and time observed and the severity.",
            
          },
          {
            label: "Photos Tab",
            description: "The Photos tab shows the images attached to the report.",
            
          },
            
        ],
      },
        {
          id: "export-report",
          label: "Export and Print",
          description: "Export button lets the user download and print the Barangay Report with signatories.",
          whyItMatters: "Placeholder — explain why monthly reports matter.",
          
        },
       ],
    },
  {
    id:"logout",
    label:"Logout",
    steps: [
      {
        id: "loogout-btn",
        label: "Logout",
        description: "The Logout button is located at the bottom of the sidebar navigation, beside the user’s name and role.",
        whyItMatters: "Placeholder — explain why audit logs matter.",
        extraSections: [
          {
            label: "Logout Confirmation",
            description: "After clicking the Logout button, a dialog asks, “Are you sure you want to log out of your account?” Click Logout to end the session and return to the login page, or click Cancel or the (x) button to stay signed in.",
          }
        ]
      },
    ]
  }
]

const SEEN_INTRO_KEY = "agos-manual-intro-seen"

function firstSteps(topic: ManualTopic): { subTopicId: string | null; steps: ManualStep[] } {
  if (topic.subTopics && topic.subTopics.length > 0) {
    return { subTopicId: topic.subTopics[0].id, steps: topic.subTopics[0].steps }
  }
  return { subTopicId: null, steps: topic.steps ?? [] }
}

function getSteps(topic: ManualTopic, subTopicId: string | null): ManualStep[] {
  if (topic.subTopics && topic.subTopics.length > 0) {
    const sub = topic.subTopics.find((s) => s.id === subTopicId) ?? topic.subTopics[0]
    return sub.steps
  }
  return topic.steps ?? []
}

function visitKey(topicId: string, subTopicId: string | null) {
  return subTopicId ? `${topicId}:${subTopicId}` : topicId
}

export default function UserManual() {
  const [showIntro, setShowIntro] = useState(false)
  const [checkedStorage, setCheckedStorage] = useState(false)

  const [showTour, setShowTour] = useState(false)

  const [search, setSearch] = useState("")

  const [filter, setFilter] = useState("all")

  const initial = firstSteps(TOPICS[0])
  const [activeTopicId, setActiveTopicId] = useState(TOPICS[0].id)
  const [activeSubTopicId, setActiveSubTopicId] = useState<string | null>(initial.subTopicId)
  const [activeStepId, setActiveStepId] = useState(initial.steps[0].id)

  // Tracks which step ids have been viewed, keyed by "topicId" or "topicId:subTopicId"
  const [visitedByKey, setVisitedByKey] = useState<Record<string, string[]>>({
    [visitKey(TOPICS[0].id, initial.subTopicId)]: [initial.steps[0].id],
  })

  useEffect(() => {
    const seenIntro = !!localStorage.getItem(SEEN_INTRO_KEY)
    const seenTour = !!localStorage.getItem(SEEN_TOUR_KEY)
    setShowIntro(!seenIntro)
    setShowTour(seenIntro && !seenTour)
    setCheckedStorage(true)
  }, [])

  const dismissIntro = () => {
    localStorage.setItem(SEEN_INTRO_KEY, "true")
    setShowIntro(false)
    if (!localStorage.getItem(SEEN_TOUR_KEY)) setShowTour(true)
  }

  const finishTour = () => {
    localStorage.setItem(SEEN_TOUR_KEY, "true")
    setShowTour(false)
  }

  const activeTopic = TOPICS.find((t) => t.id === activeTopicId)!
  const activeSubTopic = activeTopic.subTopics
    ? activeTopic.subTopics.find((s) => s.id === activeSubTopicId) ?? activeTopic.subTopics[0]
    : null
  const activeSteps = getSteps(activeTopic, activeSubTopicId)
  const activeStepIndex = activeSteps.findIndex((s) => s.id === activeStepId)
  const activeStep = activeSteps[activeStepIndex]
  const currentVisitKey = visitKey(activeTopicId, activeSubTopic ? activeSubTopic.id : null)
  const visitedStepIds = visitedByKey[currentVisitKey] ?? []

  const stepMatches = (s: ManualStep, q: string, exact = false) => {
  const text = [
    s.label,
    s.description,
    s.whyItMatters,
    ...(s.extraSections ?? []).flatMap((e) => [e.label ?? "", e.description]),
  ]
    .join(" ")
    .toLowerCase()
  if (!exact) return text.includes(q)
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(text)
  }

  const ALL_LOCATIONS = TOPICS.flatMap((t) =>
    t.subTopics && t.subTopics.length > 0
      ? t.subTopics.flatMap((s) =>
          s.steps.map((step) => ({ topicId: t.id, subTopicId: s.id as string | null, step }))
        )
      : (t.steps ?? []).map((step) => ({ topicId: t.id, subTopicId: null as string | null, step }))
  )

  const currentGlobalIndex = ALL_LOCATIONS.findIndex(
  (l) =>
    l.topicId === activeTopicId &&
    l.subTopicId === (activeSubTopic ? activeSubTopic.id : null) &&
    l.step.id === activeStepId
)

  const query = search.trim().toLowerCase()

  const filteredTopics: ManualTopic[] = !query
  ? TOPICS
  : TOPICS.reduce<ManualTopic[]>((acc, topic) => {
      if (topic.label.toLowerCase().includes(query)) {
        acc.push(topic)
        return acc
      }
      if (topic.subTopics) {
        const matching = topic.subTopics.filter(
          (s) =>
            s.label.toLowerCase().includes(query) ||
            s.steps.some((st) => stepMatches(st, query))
        )
        if (matching.length > 0) acc.push({ ...topic, subTopics: matching })
        return acc
      }
      if ((topic.steps ?? []).some((st) => stepMatches(st, query))) acc.push(topic)
      return acc
    }, [])

      

  const markVisited = (key: string, stepId: string) => {
    setVisitedByKey((prev) => {
      const current = prev[key] ?? []
      if (current.includes(stepId)) return prev
      return { ...prev, [key]: [...current, stepId] }
    })
  }

  const goToStepId = (topicId: string, subTopicId: string | null, stepId: string) => {
    setActiveTopicId(topicId)
    setActiveSubTopicId(subTopicId)
    setActiveStepId(stepId)
    markVisited(visitKey(topicId, subTopicId), stepId)
  }
  

  // Plain tab click (Dashboard, Monitoring, ... — no dropdown)
  const selectTopic = (topicId: string) => {
    const topic = TOPICS.find((t) => t.id === topicId)
    if (!topic) return
    const { subTopicId, steps } = firstSteps(topic)
    goToStepId(topicId, subTopicId, steps[0].id)
  }

  // Dropdown item click (e.g. "Clog Events" under History)
  const selectSubTopic = (topicId: string, subTopicId: string) => {
    const topic = TOPICS.find((t) => t.id === topicId)
    const sub = topic?.subTopics?.find((s) => s.id === subTopicId)
    if (!sub) return
    goToStepId(topicId, subTopicId, sub.steps[0].id)
  }

  const selectStep = (stepId: string) => {
    goToStepId(activeTopicId, activeSubTopic ? activeSubTopic.id : null, stepId)
  }

  const goToStep = (offset: number) => {
    const target = ALL_LOCATIONS[currentGlobalIndex + offset]
    if (target) goToStepId(target.topicId, target.subTopicId, target.step.id)
  }

  const handleSearch = (value: string) => {
  setSearch(value)
  const q = value.trim().toLowerCase()
  if (!q) return

  for (const exact of [true, false]) {
    if (activeStep && stepMatches(activeStep, q, exact)) return

    const inCurrentTopic = ALL_LOCATIONS.find(
      (l) => l.topicId === activeTopicId && stepMatches(l.step, q, exact)
    )
    if (inCurrentTopic) {
      goToStepId(inCurrentTopic.topicId, inCurrentTopic.subTopicId, inCurrentTopic.step.id)
      return
    }

    const anywhere = ALL_LOCATIONS.find((l) => stepMatches(l.step, q, exact))
    if (anywhere) {
      goToStepId(anywhere.topicId, anywhere.subTopicId, anywhere.step.id)
      return
    }
  }

  const labelMatch = TOPICS.find((t) => t.label.toLowerCase().includes(q))
    if (labelMatch) selectTopic(labelMatch.id)
  }

  if (!checkedStorage) return null

  if (showIntro) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4">
        <IntroScreen onGetStarted={dismissIntro} />
      </div>
    )
  }

  const sidebarTitle = activeSubTopic ? activeSubTopic.label : activeTopic.label

  return (
    <div className="max-w-20xl mx-auto py-1 px-1">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <ManualIntro onStartTour={() => setShowTour(true)} />
        <div data-tour="search">
          <SearchBar
            value={search}
            onChange={handleSearch}
            filter={filter}
            onFilterChange={setFilter}
            filterOptions={TOPICS.map((t) => t.label)}
          />
        </div>
        <div data-tour="topics">
        <TopicTabs
          topics={filteredTopics}
          activeTopicId={activeTopicId}
          activeSubTopicId={activeSubTopic ? activeSubTopic.id : null}
          onSelectTopic={selectTopic}
          onSelectSubTopic={selectSubTopic}
          searchActive={!!query}
        />
      </div>

        <div className="flex h-[calc(100vh-220px)]">
          <div className="overflow-y-auto" data-tour="steps">
            <StepsList
              title={sidebarTitle}
              description={`Below is the guide on how to use the ${sidebarTitle}.`}
              steps={activeSteps}
              activeStepId={activeStepId}
              visitedStepIds={visitedStepIds}
              onSelect={selectStep}
            />
          </div>
          <div className="flex-1 overflow-y-auto" data-tour="detail">
            <StepDetail
              stepIndex={activeStepIndex}
              totalSteps={activeSteps.length}
              title={activeStep.label}
              description={activeStep.description}
              whyItMatters={activeStep.whyItMatters}
              images={activeStep.images}
              extraSections={activeStep.extraSections}
              onPrevious={() => goToStep(-1)}
              onNext={() => goToStep(1)}
              hasPrevious={currentGlobalIndex > 0}
              hasNext={currentGlobalIndex >= 0 && currentGlobalIndex < ALL_LOCATIONS.length - 1}
            />
          </div>
          {showTour && <GuidedTour steps={TOUR_STEPS} onFinish={finishTour} />}
      </div>
      </div>
    </div>
  )
}