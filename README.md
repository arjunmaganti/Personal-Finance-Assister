# Evaluating the effectiveness of agentic frameworks on goal-based individual financial advisory

This repository contains all the code used for my Senior Project. If you would like to learn more about the process that created this project, please visit: https://basisindependent.com/schools/ca/silicon-valley/academics/the-senior-year/senior-projects/arjun-m/

Within backend is all four agent python files, and includes each of the python files that runs Variant A, Variant B, Variant C, 
and Variant D. Variants A and B are stored in a subfolder of backend titled "variants". The code for Variant C is titled "pipeline_sequential.py", and the code for Variant D is titled
"pipeline_hierarchical.py". Running these stores outputs into the output folder, which contains pre-run outputs which were used for the final rubric scoring of this project.

The frontend, built with React, contains the dockerfile + all the frontend functionality of the project in api.js and App.jsx. App.jsx contains state management for the state of the API resposne, and a Live Clock that allows users to see how much time the model spends thinking.
It also dynamically renders Variants A and B from markdown into readable text, and extracts Agent 3's "optimized_plan" and Agent 4's "user_facing_summary" to display to the user, along with an expandable full JSON.

api.js sends four simultaneous requests to the backend and links them to the async API endpoints in main.py. These endpoints, wrapped in FastAPI, connect back to their respective python functions, await a response, and return that response to the frontend using CORS middleware by matching the request URLs.

The final presentation for this project is available here: https://docs.google.com/presentation/d/1XhS7zedHwRP75OE_ik2_EJmr1wdA_sAoUJHjybQ7Lyw/edit?usp=sharing

The final deployed app for this project is available here: https://personal-finance-assister.vercel.app/

If you have any questions, please contact arjunmaganti2008@gmail.com
