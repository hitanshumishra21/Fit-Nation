// This file contains all the fitness logic and page functionality

// FitnessLogic object - contains all the fitness calculation functions
const FitnessLogic = {
    // Calculate BMI from weight and height
    calculateBmi: (weightKg, heightCm) => {
        const heightM = heightCm / 100;
        const bmi = weightKg / (heightM * heightM);
        return parseFloat(bmi.toFixed(1));
    },

    // Determine BMI category based on BMI value
    getBmiCategory: (bmi) => {
        if (bmi < 18.5) return "Underweight";
        if (bmi < 25) return "Normal weight";
        if (bmi < 30) return "Overweight";
        return "Obese";
    },

    // Get detailed analysis message for each BMI category
    getBmiAnalysis: (bmi) => {
        const category = FitnessLogic.getBmiCategory(bmi);
        const analysis = {
            "Obese": {
                "status": "Critical",
                "message": "High weight is putting significant strain on your joints and heart.",
                "recommendation": "Focus on calorie deficit and low-impact movement immediately."
            },
            "Overweight": {
                "status": "Warning",
                "message": "You are carrying extra weight that may lead to long-term health issues.",
                "recommendation": "Transition to a more active lifestyle and monitor food quality."
            },
            "Underweight": {
                "status": "Warning",
                "message": "Low body mass might indicate nutritional deficiencies or low muscle mass.",
                "recommendation": "Focus on progressive strength training and nutrient-dense foods."
            },
            "Normal weight": {
                "status": "Good",
                "message": "Your weight is within a healthy range for your height.",
                "recommendation": "Focus on maintaining this balance through consistency."
            }
        };
        return analysis[category];
    },

    // Analyze user's lifestyle and find their main problem
    analyzeLifestyle: (sleepHours, activityLevel, consistency, foodType) => {
        let points = [];
        let bottleneck = "Lifestyle";
        let limitation = "lifestyle";

        // Check food type and add protein advice
        if (foodType === "Veg") {
            points.push("Protein Planning: Vegetarian sources require very careful planning to hit targets.");
        } else if (foodType === "Egg") {
            points.push("Protein Flexibility: Eggs provide high-quality protein and moderate flexibility.");
        } else {
            points.push("Protein Accessibility: Non-veg diet allows for easy protein target achievement.");
        }

        // Find the main bottleneck (biggest problem)
        if (sleepHours < 6) {
            bottleneck = "Sleep Debt";
            limitation = "sleep";
            points.push("Severe sleep deprivation detected. Recovery is currently impossible.");
        } else if (consistency === "Quit frequently") {
            bottleneck = "Lack of Consistency";
            limitation = "consistency";
            points.push("Past patterns show frequent quitting; sustainability is now the only priority.");
        } else if (activityLevel === "Low") {
            bottleneck = "Sedentary Lifestyle";
            limitation = "lifestyle";
            points.push("Highly sedentary lifestyle detected. Movement is more important than 'intensity' right now.");
        } else {
            bottleneck = "General Recovery";
            limitation = "lifestyle";
        }

        return {
            "lifestyle_points": points,
            "primary_bottleneck": bottleneck,
            "limitation_msg": `Your biggest limitation right now is ${limitation}, not workout.`
        };
    },

    // Main function - analyzes all user data and returns complete results
    analyzeUser: (data) => {
        // Get user input data with default values
        const age = parseInt(data.age) || 25;
        const height = parseFloat(data.height) || 170;
        const weight = parseFloat(data.weight) || 70;
        const sleep = parseFloat(data.sleep) || 7;
        const activity = data.activity || 'Medium';
        const timeAvailable = parseInt(data.time) || 60;
        const foodType = data.food || 'Veg';
        const goal = data.goal || 'Maintain';
        const consistency = data.consistency || 'Quit frequently';

        // Calculate BMI and get analysis
        const bmi = FitnessLogic.calculateBmi(weight, height);
        const bmiAnalysis = FitnessLogic.getBmiAnalysis(bmi);
        const lifestyle = FitnessLogic.analyzeLifestyle(sleep, activity, consistency, foodType);

        // Determine risk level
        let riskLevel = "Medium";
        if (sleep < 6 || consistency === "Quit frequently") {
            riskLevel = "High";
        } else if (activity === "High" && consistency === "Mostly consistent") {
            riskLevel = "Low";
        }

        let paths = [];

        // Check if Gym Training is suitable
        let gymAllowed = true;
        let gymReason = "Structured environment for progressive overload.";
        if (consistency === "Quit frequently") {
            gymAllowed = false;
            gymReason = "History of frequent quitting suggests you shouldn't commit to a gym membership yet.";
        } else if (sleep < 6) {
            gymAllowed = false;
            gymReason = "Severe sleep debt makes gym-level intensity a high injury risk.";
        }
        paths.push({
            "name": "Gym Training",
            "status": gymAllowed ? "Conditional" : "Blocked",
            "confidence": gymAllowed ? 60 : 0,
            "reason": gymReason,
            "fail_condition": "Will fail if you focus on ego-lifting instead of form."
        });

        // Check if HIIT is suitable
        let hiitAllowed = true;
        let hiitReason = "Efficient but recovery-dependent; monitor CNS fatigue.";
        if (sleep < 6) {
            hiitAllowed = false;
            hiitReason = "CNS fatigue from low sleep makes high-intensity cardio dangerous.";
        } else if (consistency === "Quit frequently") {
            hiitAllowed = false;
            hiitReason = "HIIT is mentally taxing; you need to build the baseline habit first.";
        }
        paths.push({
            "name": "HIIT (High Intensity)",
            "status": hiitAllowed ? "Conditional" : "Blocked",
            "confidence": hiitAllowed ? 50 : 0,
            "reason": hiitReason,
            "fail_condition": "Will fail if CNS fatigue is ignored (stop if feeling dizzy)."
        });

        // Check if Home Workouts are suitable
        let homeAllowed = true;
        let homeReason = "Low barrier to entry. Great for building body control.";
        if (activity === "Low" && consistency === "Quit frequently") {
            homeAllowed = false;
            homeReason = "Even basic bodyweight circuits might be too much; start with movement.";
        }
        paths.push({
            "name": "Home Workouts",
            "status": homeAllowed ? "Allowed" : "Blocked",
            "confidence": homeAllowed ? 70 : 0,
            "reason": homeReason,
            "fail_condition": "Will fail if you don't keep track of your sets and reps."
        });

        // Walking & Mobility is always recommended
        paths.push({
            "name": "Walking & Mobility",
            "status": "Recommended",
            "confidence": 85,
            "reason": "The foundation of long-term health and injury prevention.",
            "fail_condition": "Will fail if you don't hit 8,000 steps daily."
        });

        // Special check for muscle gain goal
        if (goal === "Muscle gain" && consistency === "Quit frequently") {
            paths.forEach(p => {
                if (p.name === "Gym Training") {
                    p.status = "Blocked";
                    p.reason = "Muscle gain requires MONTHS of consistency. You must fix your 'quitting' pattern first.";
                }
            });
        }

        // Prepare reality check data
        const realityCheck = {
            "bmi": bmi,
            "bmi_category": FitnessLogic.getBmiCategory(bmi),
            "bmi_msg": bmiAnalysis.message,
            "primary_bottleneck": lifestyle.primary_bottleneck,
            "bottleneck_msg": lifestyle.limitation_msg,
            "lifestyle_warnings": lifestyle.lifestyle_points
        };

        // General warnings that apply to everyone
        const allPotentialWarnings = [
            { "item": "Extreme Calorie Cuts", "reason": "Destroys metabolism and leads to severe metabolic adaptation.", "priority": 1 },
            { "item": "Buying Expensive Supplements", "reason": "Waste of money if core sleep and consistency are broken.", "priority": 1 },
            { "item": "Comparing Progress to Social Media", "reason": "Most influencers use lighting, pumps, or PEDs to look like that.", "priority": 1 },
            { "item": "Ego Lifting at the Gym", "reason": "Lifting heavier than form allows leads to injury, not growth.", "priority": 1 }
        ];

        // Dynamic warnings based on user's specific situation
        let dynamicWarnings = [];
        if (sleep < 6) dynamicWarnings.push({ "item": "Late Night Intense Training", "reason": "Recovery is already compromised; midnight workouts will crash your CNS.", "priority": 10 });
        if (consistency === "Quit frequently") dynamicWarnings.push({ "item": "Complex 6-Day Exercise Splits", "reason": "You need habit building, not complexity. Start with a 3-day baseline.", "priority": 10 });
        if (bmi > 30) dynamicWarnings.push({ "item": "High-Impact Running", "reason": "At this weight, high-impact cardio like running puts 5x bodyweight stress on knees.", "priority": 10 });
        if (goal === "Fat loss") dynamicWarnings.push({ "item": "Liquid-Only Diets", "reason": "Unsustainable and leads to muscle loss; your brain needs solid food density.", "priority": 8 });
        if (goal === "Muscle gain") dynamicWarnings.push({ "item": "Ignoring Compound Lifts", "reason": "You can't grow muscle efficiently by only doing isolation (bicep curls).", "priority": 8 });
        if (timeAvailable === 90 && sleep < 6) dynamicWarnings.push({ "item": "90-Minute Marathon Sessions", "reason": "High-volume training with low sleep is a recipe for chronic inflammation.", "priority": 9 });

        // Combine and sort warnings by priority
        let combinedWarnings = [...dynamicWarnings, ...allPotentialWarnings];
        combinedWarnings.sort((a, b) => b.priority - a.priority);

        // Remove duplicate warnings
        let uniqueWarnings = [];
        let seen = new Set();
        for (let w of combinedWarnings) {
            if (!seen.has(w.item)) {
                uniqueWarnings.push(w);
                seen.add(w.item);
            }
        }

        // Create personalized routine based on multiple parameters
        let routine = "";

        // Determine user's fitness readiness level
        const isHighRisk = sleep < 6 || consistency === "Quit frequently";
        const isAthlete = activity === "High" && consistency === "Mostly consistent";
        const isSedentary = activity === "Low";
        const isOverweight = bmi >= 25;
        const isObese = bmi >= 30;

        // Generate routine based on time available and user profile
        if (timeAvailable === 30) {
            // 30 minutes available
            if (isHighRisk || consistency === "Quit frequently") {
                routine = "10 min Light Stretching + 20 min Easy Walking (Focus: Building the Habit First)";
            } else if (isSedentary) {
                routine = "5 min Warmup + 20 min Bodyweight Basics (Squats, Push-ups) + 5 min Walking";
            } else if (isAthlete && goal === "Muscle gain") {
                routine = "5 min Dynamic Warmup + 20 min Compound Lifts (Heavy Focus) + 5 min Stretch";
            } else if (goal === "Fat loss") {
                routine = "5 min Warmup + 20 min Circuit Training (Strength + Cardio Mix) + 5 min Cooldown";
            } else {
                routine = "10 min Mobility Work + 15 min Strength Training + 5 min Core Work";
            }
        } else if (timeAvailable === 60) {
            // 60 minutes available
            if (isHighRisk) {
                routine = "10 min Gentle Mobility + 35 min Low-Impact Movement (Walking/Cycling) + 15 min Stretching";
            } else if (isSedentary && consistency === "Quit frequently") {
                routine = "10 min Warmup + 30 min Basic Strength (Full Body) + 10 min Walking + 10 min Stretch";
            } else if (isObese) {
                routine = "10 min Warmup + 30 min Low-Impact Strength Training + 15 min Walking + 5 min Cooldown";
            } else if (isAthlete && goal === "Muscle gain") {
                routine = "10 min Dynamic Prep + 40 min Heavy Compound Lifts + 10 min Accessory Work";
            } else if (isAthlete && goal === "Fat loss") {
                routine = "10 min Warmup + 30 min Strength Training + 15 min HIIT Cardio + 5 min Cooldown";
            } else if (goal === "Muscle gain") {
                routine = "10 min Warmup + 40 min Progressive Strength Training + 10 min Isolation Work";
            } else if (goal === "Fat loss") {
                routine = "10 min Warmup + 25 min Strength Training + 20 min Moderate Cardio + 5 min Stretch";
            } else {
                routine = "10 min Warmup + 35 min Balanced Training (Strength + Cardio) + 15 min Mobility";
            }
        } else {
            // 90 minutes available
            if (isHighRisk) {
                routine = "15 min Mobility + 45 min Moderate Training + 30 min Active Recovery (Prevent Overtraining)";
            } else if (isSedentary && consistency === "Quit frequently") {
                routine = "15 min Warmup + 45 min Full Body Strength + 20 min Walking + 10 min Stretch (Build Foundation)";
            } else if (isAthlete && goal === "Muscle gain" && sleep >= 7) {
                routine = "15 min Dynamic Prep + 60 min Intense Strength Training + 15 min Skill/Accessory Work";
            } else if (isAthlete && goal === "Fat loss") {
                routine = "15 min Warmup + 45 min Strength Training + 20 min Cardio Intervals + 10 min Cooldown";
            } else if (goal === "Muscle gain" && consistency === "Mostly consistent") {
                routine = "15 min Warmup + 55 min Progressive Overload Training + 20 min Hypertrophy Focus";
            } else if (goal === "Fat loss") {
                routine = "15 min Warmup + 40 min Strength Training + 25 min Cardio + 10 min Core & Stretch";
            } else if (sleep >= 6 && consistency === "Mostly consistent") {
                routine = "15 min Dynamic Prep + 50 min Balanced Training + 15 min Skill Work + 10 min Recovery";
            } else {
                routine = "15 min Warmup + 50 min Moderate Training + 25 min Active Recovery (Sustainability Focus)";
            }
        }

        // Select myths based on user's goal
        let myths = [];

        if (goal === "Fat loss") {
            myths = [
                { "myth": "Spot reduction (reducing fat in one area)", "reality": "Fat loss happens globally across the body, not where you work out.", "avoid": "Those doing 1000 situps to lose belly fat." },
                { "myth": "More sweat = more fat loss", "reality": "Sweat is for cooling your body, not melting fat.", "avoid": "People wearing winter hoodies in the gym." },
                { "myth": "Cardio is the only way to lose fat", "reality": "Strength training builds muscle which increases your resting metabolic rate.", "avoid": "Ignoring resistance training completely." }
            ];
        } else if (goal === "Muscle gain") {
            myths = [
                { "myth": "You need to eat constantly to gain muscle", "reality": "Muscle growth requires a moderate calorie surplus and adequate protein, not endless eating.", "avoid": "Dirty bulking that leads to excessive fat gain." },
                { "myth": "More protein always equals more muscle", "reality": "Beyond 1.6-2.2g per kg bodyweight, extra protein doesn't build more muscle.", "avoid": "Wasting money on excessive protein supplements." },
                { "myth": "You must lift heavy every single day", "reality": "Muscle grows during recovery, not during the workout. Rest days are essential.", "avoid": "Overtraining and ignoring recovery signals." }
            ];
        } else {
            myths = [
                { "myth": "Maintenance means doing nothing", "reality": "Maintaining fitness requires consistent effort, just not progressive overload.", "avoid": "Completely stopping your routine." },
                { "myth": "You can eat whatever you want if you exercise", "reality": "Nutrition quality still matters for health, energy, and body composition.", "avoid": "Using exercise as an excuse for poor diet choices." },
                { "myth": "Maintenance is boring and pointless", "reality": "Maintenance is a skill that prevents yo-yo dieting and builds long-term habits.", "avoid": "Constantly chasing extreme transformations." }
            ];
        }

        // Return all the analysis results
        return {
            "user_input": { goal, food_type: foodType, time: timeAvailable, consistency },
            "risk_level": riskLevel,
            "reality_check": realityCheck,
            "paths": paths,
            "not_to_do": uniqueWarnings.slice(0, 4),
            "routine": routine,
            "trace": [
                { "step": "Sleep Check", "status": sleep >= 6 ? "Passed" : "Failed", "detail": `User reported ${sleep}h sleep.` },
                { "step": "Consistency Check", "status": consistency === "Mostly consistent" ? "Passed" : "Failed", "detail": `User pattern: ${consistency}.` },
                { "step": "Time Alignment", "status": "Passed", "detail": `${timeAvailable} min window confirmed.` },
                { "step": "Goal Alignment", "status": "Passed", "detail": `Optimizing for ${goal}.` }
            ],
            "myths": myths
        };
    }
};

// When the page loads, run this code
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the engine page (form page)
    const fitnessForm = document.getElementById('fitnessForm');
    if (fitnessForm) {
        // When user submits the form
        fitnessForm.addEventListener('submit', function (e) {
            e.preventDefault(); // Stop the form from submitting normally
            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());
            const result = FitnessLogic.analyzeUser(data); // Analyze the data
            localStorage.setItem('fitNationResult', JSON.stringify(result)); // Save results
            window.location.href = '/results'; // Go to results page
        });
    }

    // Check if we're on the results page
    const resultsPage = document.querySelector('.results-dashboard');
    if (resultsPage) {
        // Get the saved results from storage
        const rawResult = localStorage.getItem('fitNationResult');
        if (!rawResult) {
            // If no results, go back to engine page
            window.location.href = '/engine';
            return;
        }

        const result = JSON.parse(rawResult);

        // Fill in the risk level badge
        const riskBadge = document.getElementById('riskLevelBadge');
        const riskText = document.getElementById('riskLevelText');
        if (riskBadge && riskText) {
            riskBadge.setAttribute('data-level', result.risk_level);
            riskText.textContent = result.risk_level;
        }

        // Fill in the on-track badge
        const onTrackBadge = document.getElementById('onTrackBadge');
        if (onTrackBadge) {
            onTrackBadge.textContent = result.risk_level === 'Low' ? 'On Track' : (result.risk_level === 'High' ? 'High Risk' : 'Needs Focus');
            onTrackBadge.className = 'badge ' + (result.risk_level === 'Low' ? 'badge-green' : (result.risk_level === 'High' ? 'badge-red' : 'badge-amber'));
        }

        // Fill in BMI and goal information
        const bmiVal = document.getElementById('bmiValue');
        const bmiCat = document.getElementById('bmiCategoryLabel');
        const goalTxt = document.getElementById('goalText');
        const bntTitle = document.getElementById('bottleneckTitle');
        const bntMsg = document.getElementById('bottleneckMsg');

        if (bmiVal) bmiVal.textContent = result.reality_check.bmi;
        if (bmiCat) bmiCat.textContent = `BMI (${result.reality_check.bmi_category})`;
        if (goalTxt) goalTxt.textContent = result.user_input.goal;
        if (bntTitle) bntTitle.textContent = result.reality_check.primary_bottleneck;
        if (bntMsg) bntMsg.textContent = result.reality_check.bottleneck_msg;

        // Fill in time and consistency circles
        const timeCircle = document.getElementById('timeCircle');
        const timeText = document.getElementById('timeText');
        if (timeCircle && timeText) {
            const val = Math.round((result.user_input.time / 90) * 100);
            timeCircle.style.setProperty('--val', val);
            timeText.textContent = `${result.user_input.time}m`;
        }

        const consCircle = document.getElementById('consistencyCircle');
        const consText = document.getElementById('consistencyText');
        if (consCircle && consText) {
            const val = result.user_input.consistency === 'Mostly consistent' ? 100 : 35;
            consCircle.style.setProperty('--val', val);
            consText.textContent = result.user_input.consistency === 'Mostly consistent' ? 'High' : 'Low';
        }

        // Fill in nutrition information
        const dietType = document.getElementById('dietTypeText');
        const nutrList = document.getElementById('nutritionList');
        const nutrAlert = document.getElementById('nutritionAlertMsg');

        if (dietType) dietType.textContent = `${result.user_input.food_type} Focus`;
        if (nutrList) {
            result.reality_check.lifestyle_warnings.forEach(point => {
                const item = document.createElement('div');
                item.className = 'nutrient-item' + (point.includes('Protein') ? ' highlight' : '');
                item.innerHTML = `
                    <span class="nutrient-icon">${point.includes('Protein') ? '⚡' : '💡'}</span>
                    <div class="nutrient-text">
                        ${point.includes('Protein') ? '<strong>Protein Priority</strong>' : ''}
                        <p>${point}</p>
                    </div>
                `;
                nutrList.appendChild(item);
            });
        }
        if (nutrAlert) {
            nutrAlert.textContent = result.user_input.goal === 'Maintain'
                ? 'Adequate protein intake helps preserve muscle mass during maintenance.'
                : 'Muscle hypertrophy requires precise planning with this diet.';
        }

        // Fill in fitness paths
        const pathsPanel = document.getElementById('pathsPanel');
        if (pathsPanel) {
            result.paths.forEach(path => {
                const row = document.createElement('div');
                row.className = `path-row ${path.status === 'Blocked' ? 'blocked' : ''}`;

                let badgeClass = 'badge-green';
                if (path.status === 'Blocked') badgeClass = 'badge-red';
                else if (path.status === 'Conditional') badgeClass = 'badge-amber';
                else if (path.status === 'Recommended') badgeClass = 'badge-green';

                row.innerHTML = `
                    <div class="path-name-group">
                        <p class="path-name">${path.name}</p>
                        ${path.confidence > 0 ? `
                            <div class="confidence-container">
                                <div class="confidence-bar" style="width: ${path.confidence}%"></div>
                                <span class="confidence-text">${path.confidence}% Match</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="path-badge-group">
                        <span class="badge ${badgeClass}">${path.status.toUpperCase()}</span>
                    </div>
                    <div class="path-reason-group">
                        <p class="path-reason">${path.reason}</p>
                    </div>
                `;
                pathsPanel.appendChild(row);
            });
        }

        // Fill in avoid list
        const avoidGrid = document.getElementById('avoidGrid');
        if (avoidGrid) {
            result.not_to_do.forEach(item => {
                const card = document.createElement('div');
                card.className = 'avoid-card-item';
                card.innerHTML = `
                    <div class="avoid-header">
                        <span class="avoid-icon">✕</span>
                        <span class="avoid-title">${item.item}</span>
                    </div>
                    <p class="avoid-reason">${item.reason}</p>
                `;
                avoidGrid.appendChild(card);
            });
        }

        // Fill in decision trace
        const traceContent = document.getElementById('traceContent');
        if (traceContent) {
            result.trace.forEach(t => {
                const item = document.createElement('div');
                item.className = 'trace-item';
                item.innerHTML = `
                    <div class="trace-left">
                        <span style="font-weight: 700">${t.step}</span>
                        <span style="color: var(--text-secondary); margin-left: 1rem">${t.detail}</span>
                    </div>
                    <span class="trace-status ${t.status.toLowerCase()}">${t.status}</span>
                `;
                traceContent.appendChild(item);
            });
        }

        // Fill in myths section
        const mythsGrid = document.getElementById('mythsGrid');
        if (mythsGrid) {
            result.myths.forEach(m => {
                const item = document.createElement('div');
                item.className = 'myth-item';
                item.innerHTML = `
                    <div class="myth-header">
                        <span class="myth-status">MYTH</span>
                        <p class="myth-text">${m.myth}</p>
                    </div>
                    <div class="myth-body">
                        <span class="reality-status">REALITY</span>
                        <p class="reality-text">${m.reality}</p>
                    </div>
                    <div class="myth-footer">
                        <span class="avoid-label">AVOID:</span>
                        <span class="avoid-text">${m.avoid}</span>
                    </div>
                `;
                mythsGrid.appendChild(item);
            });
        }

        // Fill in routine and lifestyle warnings
        const routineTxt = document.getElementById('routineText');
        const lifestyleWarns = document.getElementById('lifestyleWarnings');
        if (routineTxt) routineTxt.textContent = result.routine;
        if (lifestyleWarns) {
            result.reality_check.lifestyle_warnings.forEach(warning => {
                if (!warning.includes('Protein')) {
                    const badge = document.createElement('span');
                    badge.className = 'badge';
                    badge.style.cssText = 'background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border)';
                    badge.innerHTML = `⚠️ ${warning}`;
                    lifestyleWarns.appendChild(badge);
                }
            });
        }
    }
});
