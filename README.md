# Project Name: The Ultimate Coding Time Tracker & Project Analyzer

[![GitHub stars](https://img.shields.io/github/stars/your-username/your-repo?style=for-the-badge)](https://github.com/your-username/your-repo/stargazers)
[![License](https://img.shields.io/github/license/your-username/your-repo?style=for-the-badge)](https://github.com/your-username/your-repo/blob/main/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/your-username/your-repo?style=for-the-badge)](https://github.com/your-username/your-repo/issues)
[![GitHub forks](https://img.shields.io/github/forks/your-username/your-repo?style=for-the-badge)](https://github.com/your-username/your-repo/network)

[![Animated GIF or Video of the extension in action]](link-to-animated-gif-or-video)

Supercharge your coding productivity and gain valuable insights into your projects with this powerful VSCode extension! It combines a sophisticated coding time tracker with in-depth project analysis tools, all seamlessly integrated into your favorite IDE.

## Table of Contents

- [Features](#features)
- [Motivation and Benefits](#motivation-and-benefits)
- [Project Structure (Deep Dive)](#project-structure-deep-dive)
- [Installation and Setup](#installation-and-setup)
- [Usage and Customization](#usage-and-customization)
- [Contributing and Roadmap](#contributing-and-roadmap)
- [License and Acknowledgements](#license-and-acknowledgements)
- [Screenshots and Demos](#screenshots-and-demos) 

## Features

### Intelligent Coding Time Tracking

- **Automatic Tracking:** Effortlessly monitor your coding time on a per-file basis.
- **Idle Time Detection:**  The tracker intelligently pauses when you're not actively coding.
- **Precise Time Logs:** Get detailed reports on your coding sessions, including total time per file and overall coding time.
- **Customizable Intervals:** Define your preferred idle time thresholds.
- **Persistent Storage:** Your coding time data is safely stored for future reference.

### Comprehensive Project Analysis

- **File Extension Breakdown:**  Visualize the distribution of file types in your project.
- **Code Metrics:**  Gain insights into file sizes, line counts, and character counts.
- **Coding Time Statistics:** See how much time you've spent on different parts of your codebase.
- **Configurable Views:** Tailor the analysis to your specific needs.
- **Interactive Tree View:** Easily navigate through your project's files and folders.

## Motivation and Benefits

This project was born out of the desire to:

- **Optimize Productivity:**  Understand where your time is spent to identify bottlenecks and improve your workflow.
- **Track Progress:** Quantify your coding efforts and monitor your progress over time.
- **Gain Deeper Insights:**  Uncover patterns in your coding habits and make data-driven decisions.

By using this extension, you'll be able to:

- **Improve Time Management:** Allocate your time more effectively by focusing on the most critical tasks.
- **Identify Areas for Improvement:** Pinpoint areas of your codebase that might benefit from refactoring or optimization.
- **Enhance Learning:**  Track your progress as you learn new languages or technologies.

## Project Structure (Deep Dive)

├── database/

│   ├── index.ts    (Exports database module)
│   └── manager.ts   (Handles database operations: saving, loading, querying)
├── extensions/
│   ├── index.ts    (Exports extensions module)
│   ├── extension_item.ts  (Represents a single extension item in the tree view)
│   └── map.ts       (Maps file extensions to user-friendly names)
├── project_analsis/
│   ├── file_item.ts   (Represents a single file item in the tree view)
│   ├── formater.ts  (Utility functions for formatting time)
│   ├── index.ts  (Exports project analysis module)
│   └── provider.ts  (Provides data for the project analysis tree view)
├── timing/
│   ├── interface.ts  (Defines interfaces for timing data)
│   └── timer.ts       (Core logic for tracking coding time)
└── extension.ts     (Main entry point, activates extension features)

[Image of Database Structure]

- **Database:** Uses NeDB for lightweight, embedded data storage.  
    - Stores coding time data (file path, last edit time, total time, isWriting flag).
- **Extensions:**
    - Leverages VSCode's TreeDataProvider for a hierarchical view of file extensions.
- **Project Analysis:**
    - Traverses the workspace directory to collect file metadata (line count, character count, size).
    - Combines file metadata with coding time data from the database.
    - Displays information in a user-friendly format.
- **Timing:**
    - Listens to VSCode's `onDidChangeTextDocument` event to detect coding activity.
    - Implements a debounce mechanism to avoid excessive database writes.
    - Calculates and updates total coding time per file.