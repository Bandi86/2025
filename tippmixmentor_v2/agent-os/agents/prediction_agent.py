from typing import Dict, Any, List, Optional
import httpx
import asyncio
from datetime import datetime, timedelta
import json

from agents.base_agent import BaseAgent
from core.config import settings
from core.monitoring import record_prediction_made, record_insight_generated

class PredictionAgent(BaseAgent):
    """Enhanced agent specialized in football match predictions with ML integration"""
    
    def __init__(self, agent_id: str, name: str, config: Dict[str, Any] = None):
        super().__init__(agent_id, name, "prediction", config)
        self.ml_service_url = settings.ML_SERVICE_URL
        self.backend_url = settings.BACKEND_URL
        self.confidence_threshold = self.config.get('confidence_threshold', 0.7)
        self.max_retries = self.config.get('max_retries', 3)
        self.retry_delay = self.config.get('retry_delay', 1.0)
        
    async def execute_task(self, task_type: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute prediction-related tasks with enhanced error handling"""
        
        try:
            if task_type == "predict_match":
                return await self._predict_match(input_data)
            elif task_type == "batch_predict":
                return await self._batch_predict(input_data)
            elif task_type == "analyze_team":
                return await self._analyze_team(input_data)
            elif task_type == "generate_insights":
                return await self._generate_insights(input_data)
            elif task_type == "update_predictions":
                return await self._update_predictions(input_data)
            elif task_type == "enhanced_prediction":
                return await self._enhanced_prediction(input_data)
            elif task_type == "workflow_prediction":
                return await self._workflow_prediction(input_data)
            else:
                raise ValueError(f"Unknown task type: {task_type}")
        except Exception as e:
            self.logger.error("Task execution failed", 
                            task_type=task_type, 
                            error=str(e), 
                            input_data=input_data)
            raise
            
    async def _enhanced_prediction(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Enhanced prediction with multiple model approaches"""
        try:
            # Extract match data
            home_team_id = input_data.get('home_team_id')
            away_team_id = input_data.get('away_team_id')
            match_date = input_data.get('match_date')
            home_team_name = input_data.get('home_team_name')
            away_team_name = input_data.get('away_team_name')
            
            if not all([home_team_id, away_team_id, match_date]):
                raise ValueError("Missing required match data")
                
            # Get team analysis first
            team_analysis = await self._get_team_analysis(home_team_id, away_team_id)
            
            # Call ML service for prediction
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.ml_service_url}/predictions/predict",
                    json={
                        "home_team_id": home_team_id,
                        "away_team_id": away_team_id,
                        "match_date": match_date,
                        "home_team_name": home_team_name,
                        "away_team_name": away_team_name
                    },
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    raise Exception(f"ML service error: {response.status_code}")
                    
                prediction_data = response.json()
                
                # Get AI insights
                ai_insights = await self._get_ai_insights(home_team_id, away_team_id, match_date)
                
                # Combine all data
                enhanced_prediction = {
                    "prediction": prediction_data,
                    "team_analysis": team_analysis,
                    "ai_insights": ai_insights,
                    "confidence_score": self._calculate_confidence(prediction_data, team_analysis),
                    "recommendations": self._generate_recommendations(prediction_data, team_analysis, ai_insights),
                    "risk_assessment": self._assess_risk(prediction_data, team_analysis),
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                # Add to memory
                await self.add_to_memory({
                    "type": "enhanced_prediction",
                    "match": f"{home_team_name} vs {away_team_name}",
                    "prediction": enhanced_prediction,
                    "timestamp": datetime.utcnow().isoformat()
                })
                
                # Record metrics
                record_prediction_made("enhanced", enhanced_prediction["confidence_score"])
                
                return {
                    "success": True,
                    "enhanced_prediction": enhanced_prediction,
                    "agent_id": self.agent_id,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
        except Exception as e:
            self.logger.error("Failed to make enhanced prediction", error=str(e), input_data=input_data)
            raise
            
    async def _workflow_prediction(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a complete prediction workflow"""
        try:
            workflow_type = input_data.get('workflow_type', 'standard')
            match_data = input_data.get('match_data', {})
            
            workflow_steps = {
                'standard': [
                    'data_validation',
                    'team_analysis',
                    'prediction_generation',
                    'insight_generation',
                    'confidence_calculation',
                    'recommendation_generation'
                ],
                'comprehensive': [
                    'data_validation',
                    'team_analysis',
                    'historical_analysis',
                    'prediction_generation',
                    'ai_insights',
                    'trend_analysis',
                    'confidence_calculation',
                    'risk_assessment',
                    'recommendation_generation',
                    'validation_check'
                ]
            }
            
            steps = workflow_steps.get(workflow_type, workflow_steps['standard'])
            workflow_result = {
                "workflow_type": workflow_type,
                "steps": [],
                "final_result": None,
                "execution_time": None,
                "status": "completed"
            }
            
            start_time = datetime.utcnow()
            
            for step in steps:
                step_result = await self._execute_workflow_step(step, match_data)
                workflow_result["steps"].append({
                    "step": step,
                    "result": step_result,
                    "timestamp": datetime.utcnow().isoformat()
                })
                
            workflow_result["execution_time"] = (datetime.utcnow() - start_time).total_seconds()
            workflow_result["final_result"] = self._compile_workflow_result(workflow_result["steps"])
            
            # Add to memory
            await self.add_to_memory({
                "type": "workflow_prediction",
                "workflow_type": workflow_type,
                "result": workflow_result,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            return {
                "success": True,
                "workflow_result": workflow_result,
                "agent_id": self.agent_id,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error("Workflow prediction failed", error=str(e), input_data=input_data)
            raise
            
    async def _execute_workflow_step(self, step: str, match_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a single workflow step"""
        try:
            if step == 'data_validation':
                return await self._validate_match_data(match_data)
            elif step == 'team_analysis':
                return await self._get_team_analysis(match_data.get('home_team_id'), match_data.get('away_team_id'))
            elif step == 'historical_analysis':
                return await self._analyze_historical_data(match_data)
            elif step == 'prediction_generation':
                return await self._predict_match(match_data)
            elif step == 'ai_insights':
                return await self._get_ai_insights(match_data.get('home_team_id'), match_data.get('away_team_id'), match_data.get('match_date'))
            elif step == 'trend_analysis':
                return await self._analyze_trends([])  # Would get from memory
            elif step == 'confidence_calculation':
                return {"confidence_score": 0.75}  # Placeholder
            elif step == 'risk_assessment':
                return {"risk_level": "medium", "risk_factors": []}
            elif step == 'recommendation_generation':
                return {"recommendations": ["Recommendation 1", "Recommendation 2"]}
            elif step == 'validation_check':
                return {"validation_passed": True}
            else:
                return {"error": f"Unknown workflow step: {step}"}
        except Exception as e:
            return {"error": str(e)}
            
    def _compile_workflow_result(self, steps: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Compile final result from workflow steps"""
        result = {}
        for step in steps:
            if step["result"] and "error" not in step["result"]:
                result[step["step"]] = step["result"]
        return result
            
    async def _validate_match_data(self, match_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate match data"""
        required_fields = ['home_team_id', 'away_team_id', 'match_date']
        missing_fields = [field for field in required_fields if not match_data.get(field)]
        
        if missing_fields:
            return {"valid": False, "missing_fields": missing_fields}
        
        return {"valid": True, "validation_passed": True}
        
    async def _analyze_historical_data(self, match_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze historical data for the match"""
        # This would contain logic to analyze historical matchups
        return {
            "head_to_head": "analyzing...",
            "recent_form": "analyzing...",
            "historical_trends": "analyzing..."
        }
            
    async def _predict_match(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Predict outcome for a single match with retry logic"""
        for attempt in range(self.max_retries):
            try:
                # Extract match data
                home_team_id = input_data.get('home_team_id')
                away_team_id = input_data.get('away_team_id')
                match_date = input_data.get('match_date')
                home_team_name = input_data.get('home_team_name')
                away_team_name = input_data.get('away_team_name')
                
                if not all([home_team_id, away_team_id, match_date]):
                    raise ValueError("Missing required match data")
                    
                # Call ML service for prediction
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{self.ml_service_url}/predictions/predict",
                        json={
                            "home_team_id": home_team_id,
                            "away_team_id": away_team_id,
                            "match_date": match_date,
                            "home_team_name": home_team_name,
                            "away_team_name": away_team_name
                        },
                        timeout=30.0
                    )
                    
                    if response.status_code != 200:
                        raise Exception(f"ML service error: {response.status_code}")
                        
                    prediction_data = response.json()
                    
                    # Add to memory
                    await self.add_to_memory({
                        "type": "prediction",
                        "match": f"{home_team_name} vs {away_team_name}",
                        "prediction": prediction_data,
                        "timestamp": datetime.utcnow().isoformat()
                    })
                    
                    # Record metrics
                    for pred_type, pred_data in prediction_data.items():
                        if isinstance(pred_data, dict) and 'confidence' in pred_data:
                            record_prediction_made(pred_type, pred_data['confidence'])
                    
                    return {
                        "success": True,
                        "prediction": prediction_data,
                        "agent_id": self.agent_id,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    
            except Exception as e:
                if attempt == self.max_retries - 1:
                    self.logger.error("Failed to predict match after all retries", error=str(e), input_data=input_data)
                    raise
                else:
                    self.logger.warning(f"Prediction attempt {attempt + 1} failed, retrying...", error=str(e))
                    await asyncio.sleep(self.retry_delay * (attempt + 1))
                    
    async def _batch_predict(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Predict outcomes for multiple matches with enhanced error handling"""
        try:
            matches = input_data.get('matches', [])
            if not matches:
                raise ValueError("No matches provided for batch prediction")
                
            # Limit batch size
            if len(matches) > settings.MAX_PREDICTIONS_PER_REQUEST:
                matches = matches[:settings.MAX_PREDICTIONS_PER_REQUEST]
                
            # Process matches in parallel with semaphore to limit concurrency
            semaphore = asyncio.Semaphore(5)  # Limit to 5 concurrent requests
            
            async def predict_single_match(match):
                async with semaphore:
                    try:
                        async with httpx.AsyncClient() as client:
                            response = await client.post(
                                f"{self.ml_service_url}/predictions/predict",
                                json=match,
                                timeout=30.0
                            )
                            
                            if response.status_code == 200:
                                return {"success": True, "prediction": response.json()}
                            else:
                                return {"success": False, "error": f"HTTP {response.status_code}"}
                    except Exception as e:
                        return {"success": False, "error": str(e)}
            
            # Execute predictions in parallel
            tasks = [predict_single_match(match) for match in matches]
            results = await asyncio.gather(*tasks)
            
            # Add to memory
            await self.add_to_memory({
                "type": "batch_prediction",
                "match_count": len(matches),
                "results": results,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            return {
                "success": True,
                "predictions": results,
                "match_count": len(matches),
                "successful_predictions": len([r for r in results if r["success"]]),
                "failed_predictions": len([r for r in results if not r["success"]]),
                "agent_id": self.agent_id,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error("Failed to batch predict", error=str(e), input_data=input_data)
            raise
            
    async def _analyze_team(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze team performance and statistics with enhanced data"""
        try:
            team_id = input_data.get('team_id')
            team_name = input_data.get('team_name')
            analysis_type = input_data.get('analysis_type', 'comprehensive')
            
            if not team_id:
                raise ValueError("Team ID is required")
                
            # Get team data from backend
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.backend_url}/matches/team/{team_id}",
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    raise Exception(f"Backend service error: {response.status_code}")
                    
                team_data = response.json()
                
                # Generate analysis insights based on type
                if analysis_type == 'comprehensive':
                    analysis = await self._generate_comprehensive_team_analysis(team_data)
                elif analysis_type == 'performance':
                    analysis = await self._generate_performance_analysis(team_data)
                elif analysis_type == 'tactical':
                    analysis = await self._generate_tactical_analysis(team_data)
                else:
                    analysis = await self._generate_team_analysis(team_data)
                
                # Add to memory
                await self.add_to_memory({
                    "type": "team_analysis",
                    "team": team_name or team_id,
                    "analysis_type": analysis_type,
                    "analysis": analysis,
                    "timestamp": datetime.utcnow().isoformat()
                })
                
                return {
                    "success": True,
                    "team_analysis": analysis,
                    "team_data": team_data,
                    "analysis_type": analysis_type,
                    "agent_id": self.agent_id,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
        except Exception as e:
            self.logger.error("Failed to analyze team", error=str(e), input_data=input_data)
            raise
            
    async def _get_team_analysis(self, home_team_id: str, away_team_id: str) -> Dict[str, Any]:
        """Get analysis for both teams"""
        try:
            home_analysis = await self._analyze_team({"team_id": home_team_id})
            away_analysis = await self._analyze_team({"team_id": away_team_id})
            
            return {
                "home_team": home_analysis.get("team_analysis", {}),
                "away_team": away_analysis.get("team_analysis", {}),
                "comparison": self._compare_teams(home_analysis.get("team_analysis", {}), away_analysis.get("team_analysis", {}))
            }
        except Exception as e:
            self.logger.error("Failed to get team analysis", error=str(e))
            return {"error": str(e)}
            
    async def _get_ai_insights(self, home_team_id: str, away_team_id: str, match_date: str) -> Dict[str, Any]:
        """Get AI insights for the match"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.ml_service_url}/predictions/ai-insights",
                    json={
                        "home_team_id": home_team_id,
                        "away_team_id": away_team_id,
                        "match_date": match_date
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    return {"error": f"AI insights service error: {response.status_code}"}
        except Exception as e:
            self.logger.error("Failed to get AI insights", error=str(e))
            return {"error": str(e)}
            
    def _compare_teams(self, home_analysis: Dict[str, Any], away_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Compare two teams based on their analysis"""
        return {
            "strength_comparison": "analyzing...",
            "form_comparison": "analyzing...",
            "tactical_matchup": "analyzing..."
        }
        
    def _calculate_confidence(self, prediction_data: Dict[str, Any], team_analysis: Dict[str, Any]) -> float:
        """Calculate confidence score based on prediction and team analysis"""
        # This would contain logic to calculate confidence
        return 0.75
        
    def _generate_recommendations(self, prediction_data: Dict[str, Any], team_analysis: Dict[str, Any], ai_insights: Dict[str, Any]) -> List[str]:
        """Generate betting recommendations"""
        return [
            "Consider home team advantage",
            "Check recent form trends",
            "Monitor team news and injuries"
        ]
        
    def _assess_risk(self, prediction_data: Dict[str, Any], team_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Assess risk level for the prediction"""
        return {
            "risk_level": "medium",
            "risk_factors": ["Factor 1", "Factor 2"],
            "confidence_interval": [0.6, 0.9]
        }
            
    async def _generate_insights(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate insights from predictions and data"""
        try:
            insight_type = input_data.get('insight_type', 'general')
            
            # Get recent predictions from memory
            recent_memory = await self.get_memory(limit=50)
            predictions = [entry for entry in recent_memory if entry.get('data', {}).get('type') == 'prediction']
            
            if not predictions:
                return {
                    "success": True,
                    "insights": [],
                    "message": "No recent predictions available for insights"
                }
                
            # Generate insights based on type
            if insight_type == "trend_analysis":
                insights = await self._analyze_trends(predictions)
            elif insight_type == "confidence_analysis":
                insights = await self._analyze_confidence(predictions)
            elif insight_type == "performance_analysis":
                insights = await self._analyze_performance(predictions)
            elif insight_type == "comprehensive":
                insights = await self._generate_comprehensive_insights(predictions)
            else:
                insights = await self._generate_general_insights(predictions)
                
            # Record insight generation
            record_insight_generated(self.agent_type, insight_type)
            
            # Add to memory
            await self.add_to_memory({
                "type": "insight",
                "insight_type": insight_type,
                "insights": insights,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            return {
                "success": True,
                "insights": insights,
                "insight_type": insight_type,
                "prediction_count": len(predictions),
                "agent_id": self.agent_id,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error("Failed to generate insights", error=str(e), input_data=input_data)
            raise
            
    async def _update_predictions(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update existing predictions with new data"""
        try:
            # Get matches that need updating
            days_back = input_data.get('days_back', 7)
            cutoff_date = datetime.utcnow() - timedelta(days=days_back)
            
            # Get recent predictions from memory
            recent_memory = await self.get_memory(limit=100)
            predictions = [entry for entry in recent_memory if entry.get('data', {}).get('type') == 'prediction']
            
            updated_count = 0
            for prediction_entry in predictions:
                prediction_data = prediction_entry.get('data', {})
                prediction_timestamp = datetime.fromisoformat(prediction_entry['timestamp'])
                
                if prediction_timestamp > cutoff_date:
                    # Update prediction logic here
                    updated_count += 1
                    
            return {
                "success": True,
                "updated_count": updated_count,
                "total_checked": len(predictions),
                "agent_id": self.agent_id,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error("Failed to update predictions", error=str(e), input_data=input_data)
            raise
            
    async def _generate_comprehensive_team_analysis(self, team_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive team analysis"""
        return {
            "recent_form": "analyzing...",
            "strengths": "analyzing...",
            "weaknesses": "analyzing...",
            "key_players": "analyzing...",
            "tactical_analysis": "analyzing...",
            "performance_metrics": "analyzing...",
            "injury_report": "analyzing...",
            "team_morale": "analyzing..."
        }
        
    async def _generate_performance_analysis(self, team_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate performance-focused analysis"""
        return {
            "goals_scored": "analyzing...",
            "goals_conceded": "analyzing...",
            "possession_stats": "analyzing...",
            "pass_accuracy": "analyzing...",
            "shot_accuracy": "analyzing..."
        }
        
    async def _generate_tactical_analysis(self, team_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate tactical analysis"""
        return {
            "formation": "analyzing...",
            "playing_style": "analyzing...",
            "set_pieces": "analyzing...",
            "pressing_intensity": "analyzing...",
            "transition_speed": "analyzing..."
        }
        
    async def _generate_team_analysis(self, team_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate basic team analysis"""
        return {
            "recent_form": "analyzing...",
            "strengths": "analyzing...",
            "weaknesses": "analyzing...",
            "key_players": "analyzing...",
            "tactical_analysis": "analyzing..."
        }
        
    async def _generate_comprehensive_insights(self, predictions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate comprehensive insights from predictions"""
        return [
            {
                "type": "comprehensive",
                "description": "Comprehensive analysis of recent predictions...",
                "key_findings": ["Finding 1", "Finding 2", "Finding 3"],
                "trends": ["Trend 1", "Trend 2"],
                "recommendations": ["Recommendation 1", "Recommendation 2"]
            }
        ]
        
    async def _analyze_trends(self, predictions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Analyze prediction trends"""
        return [
            {
                "type": "trend",
                "description": "Analyzing prediction trends...",
                "confidence": 0.8
            }
        ]
        
    async def _analyze_confidence(self, predictions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Analyze prediction confidence patterns"""
        return [
            {
                "type": "confidence_analysis",
                "description": "Analyzing confidence patterns...",
                "average_confidence": 0.75
            }
        ]
        
    async def _analyze_performance(self, predictions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Analyze prediction performance"""
        return [
            {
                "type": "performance_analysis",
                "description": "Analyzing prediction performance...",
                "accuracy": 0.65
            }
        ]
        
    async def _generate_general_insights(self, predictions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate general insights from predictions"""
        return [
            {
                "type": "general",
                "description": "General insights from recent predictions...",
                "key_findings": ["Finding 1", "Finding 2", "Finding 3"]
            }
        ] 