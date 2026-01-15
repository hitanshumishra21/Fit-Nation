from flask import Flask, request, jsonify
import serverless_wsgi

app = Flask(__name__)

# Fitness Logic Class (Ported from JS)
class FitnessLogic:
    @staticmethod
    def calculate_bmi(weight_kg, height_cm):
        height_m = height_cm / 100
        bmi = weight_kg / (height_m * height_m)
        return round(float(bmi), 1)

    @staticmethod
    def get_bmi_category(bmi):
        if bmi < 18.5: return "Underweight"
        if bmi < 25: return "Normal weight"
        if bmi < 30: return "Overweight"
        return "Obese"

    @staticmethod
    def get_bmi_analysis(bmi):
        category = FitnessLogic.get_bmi_category(bmi)
        analysis = {
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
        }
        return analysis.get(category, analysis["Normal weight"])

    @staticmethod
    def analyze_lifestyle(sleep_hours, activity_level, consistency, food_type):
        points = []
        bottleneck = "Lifestyle"
        limitation = "lifestyle"

        # Food Type Analysis
        if food_type == "Veg":
            points.append("Protein Planning: Vegetarian sources require very careful planning to hit targets.")
        elif food_type == "Egg":
            points.append("Protein Flexibility: Eggs provide high-quality protein and moderate flexibility.")
        else:
            points.append("Protein Accessibility: Non-veg diet allows for easy protein target achievement.")

        # Bottleneck Analysis
        if sleep_hours < 6:
            bottleneck = "Sleep Debt"
            limitation = "sleep"
            points.append("Severe sleep deprivation detected. Recovery is currently impossible.")
        elif consistency == "Quit frequently":
            bottleneck = "Lack of Consistency"
            limitation = "consistency"
            points.append("Past patterns show frequent quitting; sustainability is now the only priority.")
        elif activity_level == "Low":
            bottleneck = "Sedentary Lifestyle"
            limitation = "lifestyle"
            points.append("Highly sedentary lifestyle detected. Movement is more important than 'intensity' right now.")
        else:
            bottleneck = "General Recovery"
            limitation = "lifestyle"

        return {
            "lifestyle_points": points,
            "primary_bottleneck": bottleneck,
            "limitation_msg": f"Your biggest limitation right now is {limitation}, not workout."
        }

    @staticmethod
    def analyze_user(data):
        # Parse inputs
        try:
            age = int(data.get('age', 25))
            height = float(data.get('height', 170))
            weight = float(data.get('weight', 70))
            sleep = float(data.get('sleep', 7))
            activity = data.get('activity', 'Medium')
            time_available = int(data.get('time', 60))
            food_type = data.get('food', 'Veg')
            goal = data.get('goal', 'Maintain')
            consistency = data.get('consistency', 'Quit frequently')
        except ValueError:
            return {"error": "Invalid input values"}

        # Basic Checks
        bmi = FitnessLogic.calculate_bmi(weight, height)
        bmi_analysis = FitnessLogic.get_bmi_analysis(bmi)
        lifestyle = FitnessLogic.analyze_lifestyle(sleep, activity, consistency, food_type)

        # Risk Level
        risk_level = "Medium"
        if sleep < 6 or consistency == "Quit frequently":
            risk_level = "High"
        elif activity == "High" and consistency == "Mostly consistent":
            risk_level = "Low"

        # Paths Analysis
        paths = []
        
        # Gym Path
        gym_allowed = True
        gym_reason = "Structured environment for progressive overload."
        if consistency == "Quit frequently":
            gym_allowed = False
            gym_reason = "History of frequent quitting suggests you shouldn't commit to a gym membership yet."
        elif sleep < 6:
            gym_allowed = False
            gym_reason = "Severe sleep debt makes gym-level intensity a high injury risk."
        
        paths.append({
            "name": "Gym Training",
            "status": "Conditional" if gym_allowed else "Blocked",
            "confidence": 60 if gym_allowed else 0,
            "reason": gym_reason,
            "fail_condition": "Will fail if you focus on ego-lifting instead of form."
        })

        # HIIT Path
        hiit_allowed = True
        hiit_reason = "Efficient but recovery-dependent; monitor CNS fatigue."
        if sleep < 6:
            hiit_allowed = False
            hiit_reason = "CNS fatigue from low sleep makes high-intensity cardio dangerous."
        elif consistency == "Quit frequently":
            hiit_allowed = False
            hiit_reason = "HIIT is mentally taxing; you need to build the baseline habit first."

        paths.append({
            "name": "HIIT (High Intensity)",
            "status": "Conditional" if hiit_allowed else "Blocked",
            "confidence": 50 if hiit_allowed else 0,
            "reason": hiit_reason,
            "fail_condition": "Will fail if CNS fatigue is ignored (stop if feeling dizzy)."
        })

        # Home Path
        home_allowed = True
        home_reason = "Low barrier to entry. Great for building body control."
        if activity == "Low" and consistency == "Quit frequently":
            home_allowed = False
            home_reason = "Even basic bodyweight circuits might be too much; start with movement."
        
        paths.append({
            "name": "Home Workouts",
            "status": "Allowed" if home_allowed else "Blocked",
            "confidence": 70 if home_allowed else 0,
            "reason": home_reason,
            "fail_condition": "Will fail if you don't keep track of your sets and reps."
        })

        # Walking Path
        paths.append({
            "name": "Walking & Mobility",
            "status": "Recommended",
            "confidence": 85,
            "reason": "The foundation of long-term health and injury prevention.",
            "fail_condition": "Will fail if you don't hit 8,000 steps daily."
        })

        # Muscle Gain Special Check
        if goal == "Muscle gain" and consistency == "Quit frequently":
            for p in paths:
                if p["name"] == "Gym Training":
                    p["status"] = "Blocked"
                    p["reason"] = "Muscle gain requires MONTHS of consistency. You must fix your 'quitting' pattern first."

        # Warnings
        reality_check = {
            "bmi": bmi,
            "bmi_category": FitnessLogic.get_bmi_category(bmi),
            "bmi_msg": bmi_analysis["message"],
            "primary_bottleneck": lifestyle["primary_bottleneck"],
            "bottleneck_msg": lifestyle["limitation_msg"],
            "lifestyle_warnings": lifestyle["lifestyle_points"]
        }

        all_potential_warnings = [
            { "item": "Extreme Calorie Cuts", "reason": "Destroys metabolism and leads to severe metabolic adaptation.", "priority": 1 },
            { "item": "Buying Expensive Supplements", "reason": "Waste of money if core sleep and consistency are broken.", "priority": 1 },
            { "item": "Comparing Progress to Social Media", "reason": "Most influencers use lighting, pumps, or PEDs to look like that.", "priority": 1 },
            { "item": "Ego Lifting at the Gym", "reason": "Lifting heavier than form allows leads to injury, not growth.", "priority": 1 }
        ]

        dynamic_warnings = []
        if sleep < 6: dynamic_warnings.append({ "item": "Late Night Intense Training", "reason": "Recovery is already compromised; midnight workouts will crash your CNS.", "priority": 10 })
        if consistency == "Quit frequently": dynamic_warnings.append({ "item": "Complex 6-Day Exercise Splits", "reason": "You need habit building, not complexity. Start with a 3-day baseline.", "priority": 10 })
        if bmi > 30: dynamic_warnings.append({ "item": "High-Impact Running", "reason": "At this weight, high-impact cardio like running puts 5x bodyweight stress on knees.", "priority": 10 })
        if goal == "Fat loss": dynamic_warnings.append({ "item": "Liquid-Only Diets", "reason": "Unsustainable and leads to muscle loss; your brain needs solid food density.", "priority": 8 })
        if goal == "Muscle gain": dynamic_warnings.append({ "item": "Ignoring Compound Lifts", "reason": "You can't grow muscle efficiently by only doing isolation (bicep curls).", "priority": 8 })
        if time_available == 90 and sleep < 6: dynamic_warnings.append({ "item": "90-Minute Marathon Sessions", "reason": "High-volume training with low sleep is a recipe for chronic inflammation.", "priority": 9 })

        combined_warnings = dynamic_warnings + all_potential_warnings
        combined_warnings.sort(key=lambda x: x['priority'], reverse=True)
        
        # Unique warnings
        unique_warnings = []
        seen = set()
        for w in combined_warnings:
            if w['item'] not in seen:
                unique_warnings.append(w)
                seen.add(w['item'])

        # Routine Logic
        routine = ""
        is_high_risk = sleep < 6 or consistency == "Quit frequently"
        is_athlete = activity == "High" and consistency == "Mostly consistent"
        is_sedentary = activity == "Low"
        is_obese = bmi >= 30

        if time_available == 30:
            if is_high_risk: routine = "10 min Light Stretching + 20 min Easy Walking (Focus: Building the Habit First)"
            elif is_sedentary: routine = "5 min Warmup + 20 min Bodyweight Basics (Squats, Push-ups) + 5 min Walking"
            elif is_athlete and goal == "Muscle gain": routine = "5 min Dynamic Warmup + 20 min Compound Lifts (Heavy Focus) + 5 min Stretch"
            elif goal == "Fat loss": routine = "5 min Warmup + 20 min Circuit Training (Strength + Cardio Mix) + 5 min Cooldown"
            else: routine = "10 min Mobility Work + 15 min Strength Training + 5 min Core Work"
        elif time_available == 60:
            if is_high_risk: routine = "10 min Gentle Mobility + 35 min Low-Impact Movement (Walking/Cycling) + 15 min Stretching"
            elif is_sedentary and consistency == "Quit frequently": routine = "10 min Warmup + 30 min Basic Strength (Full Body) + 10 min Walking + 10 min Stretch"
            elif is_obese: routine = "10 min Warmup + 30 min Low-Impact Strength Training + 15 min Walking + 5 min Cooldown"
            elif is_athlete and goal == "Muscle gain": routine = "10 min Dynamic Prep + 40 min Heavy Compound Lifts + 10 min Accessory Work"
            elif is_athlete and goal == "Fat loss": routine = "10 min Warmup + 30 min Strength Training + 15 min HIIT Cardio + 5 min Cooldown"
            elif goal == "Muscle gain": routine = "10 min Warmup + 40 min Progressive Strength Training + 10 min Isolation Work"
            elif goal == "Fat loss": routine = "10 min Warmup + 25 min Strength Training + 20 min Moderate Cardio + 5 min Stretch"
            else: routine = "10 min Warmup + 35 min Balanced Training (Strength + Cardio) + 15 min Mobility"
        else: # 90 mins
            if is_high_risk: routine = "15 min Mobility + 45 min Moderate Training + 30 min Active Recovery (Prevent Overtraining)"
            elif is_sedentary and consistency == "Quit frequently": routine = "15 min Warmup + 45 min Full Body Strength + 20 min Walking + 10 min Stretch (Build Foundation)"
            elif is_athlete and goal == "Muscle gain" and sleep >= 7: routine = "15 min Dynamic Prep + 60 min Intense Strength Training + 15 min Skill/Accessory Work"
            elif is_athlete and goal == "Fat loss": routine = "15 min Warmup + 45 min Strength Training + 20 min Cardio Intervals + 10 min Cooldown"
            elif goal == "Muscle gain" and consistency == "Mostly consistent": routine = "15 min Warmup + 55 min Progressive Overload Training + 20 min Hypertrophy Focus"
            elif goal == "Fat loss": routine = "15 min Warmup + 40 min Strength Training + 25 min Cardio + 10 min Core & Stretch"
            elif sleep >= 6 and consistency == "Mostly consistent": routine = "15 min Dynamic Prep + 50 min Balanced Training + 15 min Skill Work + 10 min Recovery"
            else: routine = "15 min Warmup + 50 min Moderate Training + 25 min Active Recovery (Sustainability Focus)"

        # Myths Logic
        myths = []
        if goal == "Fat loss":
            myths = [
                { "myth": "Spot reduction (reducing fat in one area)", "reality": "Fat loss happens globally across the body, not where you work out.", "avoid": "Those doing 1000 situps to lose belly fat." },
                { "myth": "More sweat = more fat loss", "reality": "Sweat is for cooling your body, not melting fat.", "avoid": "People wearing winter hoodies in the gym." },
                { "myth": "Cardio is the only way to lose fat", "reality": "Strength training builds muscle which increases your resting metabolic rate.", "avoid": "Ignoring resistance training completely." }
            ]
        elif goal == "Muscle gain":
            myths = [
                { "myth": "You need to eat constantly to gain muscle", "reality": "Muscle growth requires a moderate calorie surplus and adequate protein, not endless eating.", "avoid": "Dirty bulking that leads to excessive fat gain." },
                { "myth": "More protein always equals more muscle", "reality": "Beyond 1.6-2.2g per kg bodyweight, extra protein doesn't build more muscle.", "avoid": "Wasting money on excessive protein supplements." },
                { "myth": "You must lift heavy every single day", "reality": "Muscle grows during recovery, not during the workout. Rest days are essential.", "avoid": "Overtraining and ignoring recovery signals." }
            ]
        else:
            myths = [
                { "myth": "Maintenance means doing nothing", "reality": "Maintaining fitness requires consistent effort, just not progressive overload.", "avoid": "Completely stopping your routine." },
                { "myth": "You can eat whatever you want if you exercise", "reality": "Nutrition quality still matters for health, energy, and body composition.", "avoid": "Using exercise as an excuse for poor diet choices." },
                { "myth": "Maintenance is boring and pointless", "reality": "Maintenance is a skill that prevents yo-yo dieting and builds long-term habits.", "avoid": "Constantly chasing extreme transformations." }
            ]

        return {
            "user_input": { "goal": goal, "food_type": food_type, "time": time_available, "consistency": consistency },
            "risk_level": risk_level,
            "reality_check": reality_check,
            "paths": paths,
            "not_to_do": unique_warnings[:4],
            "routine": routine,
            "trace": [
                { "step": "Sleep Check", "status": "Passed" if sleep >= 6 else "Failed", "detail": f"User reported {sleep}h sleep." },
                { "step": "Consistency Check", "status": "Passed" if consistency == "Mostly consistent" else "Failed", "detail": f"User pattern: {consistency}." },
                { "step": "Time Alignment", "status": "Passed", "detail": f"{time_available} min window confirmed." },
                { "step": "Goal Alignment", "status": "Passed", "detail": f"Optimizing for {goal}." }
            ],
            "myths": myths
        }

@app.route('/api/analyze', methods=['POST'])
def analyze():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    result = FitnessLogic.analyze_user(data)
    return jsonify(result)

# Serverless WSGI handler
def handler(event, context):
    return serverless_wsgi.handle_request(app, event, context)
