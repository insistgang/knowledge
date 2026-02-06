# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**中文版本**: [CLAUDE_CN.md](CLAUDE_CN.md)

## System Overview

This is a comprehensive **Intelligent Financial Product Recommendation System** that implements advanced ML algorithms for product recommendations with a two-stage optimization strategy. The system combines Node.js backend services with a modern web frontend and sophisticated Python-based recommendation engines.

## Development Commands

### Node.js Backend
```bash
# Install dependencies
npm install

# Start main recommendation server (port 3001)
node smart_recommendation_server.js

# Start demo server (port 3000)
node demo_server.js

# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

### Python ML Components
```bash
# Run enhanced recommendation system
python python_algorithms/enhanced_recommendation_system.py

# Run complete multi-step recommendation pipeline
python python_algorithms/multi_step_recommendation_system.py

# Quick demonstration
python python_algorithms/quick_demo.py

# Product analysis testing
python python_algorithms/test_product_analysis.py
```

### Frontend Access
```bash
# Open in browser (no build process required)
open smart_recommendation_frontend.html
open new_product_analysis.html
```

## Architecture Overview

### Backend Servers
- **smart_recommendation_server.js**: Main server with enhanced recommendation engine (port 3001)
- **demo_server.js**: Basic demonstration server (port 3000)
- **server.js**: Entry point server
- **enhanced_recommendation_server*.js**: Advanced ML-powered servers
- **real_data_server*.js**: Real data processing servers

### Frontend Interfaces
- **smart_recommendation_frontend.html**: Main customer recommendation interface
- **new_product_analysis.html**: Product analysis and conflict detection interface

### Python Algorithm Modules
- **enhanced_recommendation_system.py**: Core two-step recommendation algorithm achieving 50%+ accuracy improvement
- **user_profiling_module.py**: Customer behavior analysis and segmentation
- **product_association_analysis.py**: Product relationship mapping and conflict detection
- **pattern_matching_engine.py**: User-product matching algorithms
- **strategy_selection_matrix.py**: Strategic decision frameworks
- **ab_testing_framework.py**: A/B testing and validation

## Key Technical Concepts

### Two-Step Recommendation Algorithm
1. **Step 1**: Initial recommendation based on customer demographics, historical behavior, and product features
2. **Step 2**: Feedback-based optimization with dynamic weight adjustment
3. **Target**: 50%+ accuracy improvement over Step 1

### Data Models
- **Customer**: cust_no, birth_ym, loc_cd, gender, init_dt, edu_bg, marriage_situ_cd
- **Events**: cust_no, prod_id, event_id, event_type (A/B/D), event_level, event_date, event_term, event_rate, event_amt
- **Products**: product_id, category (credit/deposit/wealth/insurance), risk_level (1-4), success_rate, avg_amount

### API Endpoints
- `GET /api/health` - System health check
- `GET /api/customers/:custNo` - Customer profile and recommendations
- `POST /api/customers/:custNo/feedback` - Submit feedback (interested/not_interested/already_have)
- `POST /api/products/new-product-analysis` - New product analysis
- `GET /api/products` - List all products

## Testing

### Pre-configured Test Customers
- `CDB91DCCE198B10A522FE2AABF6A8D81`: 82M, high-value, conservative
- `9307AC85C179D8E388DC776DB6283534`: 38F, young professional
- `9FA3282573CEB37A5E9BC1C38088087F`: 74M, retirement-focused
- `CB0D6827A924C7FFDD9DD57BF5CE9358`: 73F, senior, stable income
- `797E3448CF516A52ADBE6DB33626B50E`: 67M, pre-retirement

### Health Check
```bash
curl http://localhost:3001/api/health
```

## Important Implementation Notes

- The system uses CSV-based data storage in the `/data/` directory
- Frontend is pure HTML/CSS/JavaScript with no build process required
- Python modules require pandas, numpy, scikit-learn, imbalanced-learn
- Servers support CORS for cross-origin requests
- Recommendation algorithm includes product conflict detection (15+ conflict types)
- Marketing model implements imbalance handling with SMOTE/ADASYN techniques

## Port Configuration
- Main server: 3001
- Demo server: 3000
- Frontend: Any static file server or direct file access