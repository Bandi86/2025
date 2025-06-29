 To test the ML prediction endpoint:


   1. Ensure your backend is running. (You previously started it with npm run start:dev & in the backend directory). If you stopped it, please restart it.
   2. Send a POST request to http://localhost:3001/ml-processor/predict with a JSON body containing the match data.

  Example JSON body for a POST request:



    1 {
    2   "B365H": 1.5,
    3   "B365D": 4.0,
    4   "B365A": 6.0,
    5   "Home_GoalsScored_MA": 2.0,
    6   "Home_GoalsConceded_MA": 1.0,
    7   "Home_Points_MA": 2.5,
    8   "Away_GoalsScored_MA": 1.5,
    9   "Away_GoalsConceded_MA": 1.8,
   10   "Away_Points_MA": 1.2,
   11   "HS": 15,
   12   "AS": 10,
   13   "HST": 7,
   14   "AST": 4,
   15   "HF": 12,
   16   "AF": 10,
   17   "HC": 8,
   18   "AC": 5,
   19   "HY": 2,
   20   "AY": 1,
   21   "HR": 0,
   22   "AR": 0
   23 }