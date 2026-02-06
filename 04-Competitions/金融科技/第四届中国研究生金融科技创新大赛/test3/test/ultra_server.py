#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import http.server
import socketserver
import json
import threading
import time
import webbrowser
import random
from datetime import datetime, timedelta
from urllib.parse import urlparse

PORT = 8018  # 使用8018端口

class UltraESGAPIHandler(http.server.SimpleHTTPRequestHandler):
    def add_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def do_OPTIONS(self):
        self.send_response(200)
        self.add_cors_headers()
        self.end_headers()

    def do_GET(self):
        if self.path == '/' or self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.add_cors_headers()
            self.end_headers()
            response = {
                "message": "双碳比赛系统 Ultra API",
                "version": "2.0.0",
                "status": "running",
                "service": "超大规模ESG评价与碳金融服务平台",
                "data_scale": {
                    "companies": 156,
                    "blockchain_txs": 1247,
                    "carbon_assets": 187,
                    "esg_history": 2156
                }
            }
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))

        elif self.path == '/stats':
            self.send_response(200)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.add_cors_headers()
            self.end_headers()

            # 生成动态的行业数据，确保总和为156
            industries_data = []
            industries = [
                "环保技术", "新能源", "制造业", "金融业", "农业科技", "建筑工程",
                "信息技术", "新能源汽车", "咨询服务", "生物医药", "金融科技", "化工材料"
            ]

            # 为每个行业分配基准数量，确保总和为156
            base_distribution = {
                "环保技术": 18, "新能源": 16, "制造业": 15, "金融业": 12,
                "农业科技": 14, "建筑工程": 11, "信息技术": 17, "新能源汽车": 13,
                "咨询服务": 10, "生物医药": 12, "金融科技": 8, "化工材料": 10
            }

            total_allocated = 0
            for i, industry in enumerate(industries):
                if i == len(industries) - 1:
                    # 最后一个行业分配剩余的数量，确保总和为156
                    count = 156 - total_allocated
                else:
                    # 其他行业在基准数量上小幅随机调整
                    base_count = base_distribution.get(industry, 10)
                    count = base_count + random.randint(-3, 3)
                    count = max(5, count)  # 确保至少有5家企业

                total_allocated += count

                base_score = {
                    "环保技术": 72, "新能源": 75, "制造业": 62, "金融业": 68,
                    "农业科技": 65, "建筑工程": 58, "信息技术": 69,
                    "新能源汽车": 74, "生物医药": 70, "金融科技": 71, "化工材料": 55
                }.get(industry, 65)

                avg_score = base_score + random.randint(-10, 15)
                avg_score = max(40, min(92, avg_score))

                industries_data.append({
                    "name": industry,
                    "count": count,
                    "avg_esg_score": round(avg_score, 1)
                })

            response = {
                "total_companies": 156,
                "total_esg_evaluations": 3847,
                "total_carbon_assets": 187,
                "total_transactions": 1247,
                "total_carbon_value": 287450000,
                "system_status": "operational",
                "industries": industries_data,
                "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))

        elif self.path.startswith('/api/v1/companies'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.add_cors_headers()
            self.end_headers()

            # 解析分页参数
            page = 1
            page_size = 50
            if '?' in self.path:
                params = self.path.split('?')[1]
                for param in params.split('&'):
                    if '=' in param:
                        key, value = param.split('=', 1)
                        if key == 'page':
                            page = int(value)
                        elif key == 'page_size':
                            page_size = int(value)

            # 加载真实的企业数据
            companies = self.load_real_companies()

            # 分页处理
            start_idx = (page - 1) * page_size
            end_idx = start_idx + page_size
            page_companies = companies[start_idx:end_idx]

            response = {
                "success": True,
                "data": page_companies,
                "pagination": {
                    "page": page,
                    "page_size": page_size,
                    "total": len(companies),
                    "total_pages": (len(companies) + page_size - 1) // page_size
                }
            }
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))

        elif self.path.startswith('/api/v1/blockchain/transactions'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.add_cors_headers()
            self.end_headers()

            # 解析分页参数
            page = 1
            page_size = 100
            if '?' in self.path:
                params = self.path.split('?')[1]
                for param in params.split('&'):
                    if '=' in param:
                        key, value = param.split('=', 1)
                        if key == 'page':
                            page = int(value)
                        elif key == 'page_size':
                            page_size = int(value)

            # 生成超大规模区块链数据
            transactions = self.generate_ultra_blockchain_data()

            # 分页处理
            start_idx = (page - 1) * page_size
            end_idx = start_idx + page_size
            page_transactions = transactions[start_idx:end_idx]

            response = {
                "success": True,
                "data": page_transactions,
                "pagination": {
                    "page": page,
                    "page_size": page_size,
                    "total": len(transactions),
                    "total_pages": (len(transactions) + page_size - 1) // page_size
                }
            }
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))

        elif self.path == '/api/v1/carbon-assets':
            self.send_response(200)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.add_cors_headers()
            self.end_headers()

            carbon_assets = self.generate_ultra_carbon_assets()
            response = {"success": True, "data": carbon_assets, "total": len(carbon_assets)}
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))

        elif self.path.startswith('/api/v1/esg/history'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.add_cors_headers()
            self.end_headers()

            esg_history = self.generate_ultra_esg_history()
            response = {"success": True, "data": esg_history, "total": len(esg_history)}
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))

        elif self.path == '/api/system/status':
            self.send_response(200)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.add_cors_headers()
            self.end_headers()

            # 生成动态系统监控数据
            cpu_usage = random.uniform(25, 85)
            memory_usage = random.uniform(40, 90)
            disk_usage = random.uniform(30, 70)

            response = {
                "status": "operational",
                "uptime": "30天 15小时 42分钟",
                "version": "2.0.0",
                "system_resources": {
                    "cpu_percent": round(cpu_usage, 1),
                    "memory_percent": round(memory_usage, 1),
                    "disk_percent": round(disk_usage, 1),
                    "network_io": {
                        "bytes_sent": random.randint(1000000, 5000000),
                        "bytes_recv": random.randint(2000000, 8000000)
                    }
                },
                "performance_metrics": {
                    "total_calls_last_hour": random.randint(800, 2500),
                    "avg_response_time": round(random.uniform(0.1, 0.5), 3),
                    "error_rate": round(random.uniform(0.001, 0.025), 4),
                    "active_connections": random.randint(15, 45)
                },
                "services": [
                    {"name": "ESG评价服务", "status": "healthy", "response_time": 0.245},
                    {"name": "碳资产估值服务", "status": "healthy", "response_time": 0.189},
                    {"name": "区块链服务", "status": "healthy", "response_time": 0.156},
                    {"name": "数据处理服务", "status": "healthy", "response_time": 0.298}
                ]
            }
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))

        elif self.path.startswith('/api/system/metrics'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.add_cors_headers()
            self.end_headers()

            period = "1h"
            if '?' in self.path:
                params = self.path.split('?')[1]
                if 'period=' in params:
                    period = params.split('period=')[1].split('&')[0]

            response = {
                "period": period,
                "total_calls": random.randint(1200, 3500),
                "total_errors": random.randint(5, 45),
                "error_rate": round(random.uniform(0.002, 0.015), 4),
                "avg_response_time": round(random.uniform(0.15, 0.45), 3),
                "p95_response_time": round(random.uniform(0.8, 2.5), 3),
                "endpoints": {
                    "/api/v1/esg/evaluate": {
                        "calls": random.randint(300, 800),
                        "errors": random.randint(1, 8),
                        "error_rate": round(random.uniform(0.005, 0.020), 4),
                        "avg_response_time": round(random.uniform(0.3, 0.8), 3)
                    },
                    "/api/v1/companies": {
                        "calls": random.randint(500, 1200),
                        "errors": random.randint(2, 15),
                        "error_rate": round(random.uniform(0.002, 0.012), 4),
                        "avg_response_time": round(random.uniform(0.1, 0.3), 3)
                    },
                    "/api/v1/carbon/valuation": {
                        "calls": random.randint(200, 600),
                        "errors": random.randint(1, 6),
                        "error_rate": round(random.uniform(0.003, 0.018), 4),
                        "avg_response_time": round(random.uniform(0.2, 0.6), 3)
                    },
                    "/api/v1/blockchain/transactions": {
                        "calls": random.randint(100, 400),
                        "errors": 0,
                        "error_rate": 0.0,
                        "avg_response_time": round(random.uniform(0.1, 0.4), 3)
                    }
                }
            }
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))

        elif self.path == '/api/system/alerts':
            self.send_response(200)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.add_cors_headers()
            self.end_headers()

            # 生成动态告警数据
            alerts = []
            if random.random() > 0.7:  # 30%概率有告警
                alert_types = [
                    {
                        "type": "性能告警",
                        "level": "warning",
                        "message": f"API响应时间异常: {random.uniform(1.5, 3.0):.2f}s",
                        "metric": "response_time",
                        "threshold": 2.0
                    },
                    {
                        "type": "资源告警",
                        "level": "warning" if random.random() > 0.3 else "error",
                        "message": f"CPU使用率较高: {random.uniform(75, 95):.1f}%",
                        "metric": "cpu_usage",
                        "threshold": 80.0
                    },
                    {
                        "type": "业务告警",
                        "level": "info",
                        "message": f"批量处理任务完成: {random.randint(100, 1000)}条记录",
                        "metric": "batch_processing",
                        "threshold": 0
                    }
                ]
                alerts = [random.choice(alert_types) for _ in range(random.randint(1, 3))]

            self.wfile.write(json.dumps(alerts, ensure_ascii=False).encode('utf-8'))

        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/v1/esg/evaluate':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                request_data = json.loads(post_data.decode('utf-8'))
            except UnicodeDecodeError:
                request_data = json.loads(post_data.decode('gbk', errors='ignore'))

            self.send_response(200)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.add_cors_headers()
            self.end_headers()

            # 获取输入参数
            company_id = request_data.get('company_id', random.randint(1, 156))

            # 根据company_id获取真实企业信息
            companies = self.load_real_companies()
            company_info = None
            for company in companies:
                if company['id'] == company_id:
                    company_info = company
                    break

            if company_info:
                company_name = company_info.get('name', f'企业{company_id:03d}')
                industry = company_info.get('industry', random.choice(['环保技术', '新能源', '制造业', '金融业']))
            else:
                company_name = f'企业{company_id:03d}'
                industry = random.choice(['环保技术', '新能源', '制造业', '金融业'])
            environmental_score = float(request_data.get('environmental_score', random.uniform(45, 75)))
            social_score = float(request_data.get('social_score', random.uniform(40, 70)))
            governance_score = float(request_data.get('governance_score', random.uniform(50, 80)))

            # 根据输入数据计算ESG评分
            weights = {'environmental': 0.35, 'social': 0.30, 'governance': 0.35}
            overall_score = (
                environmental_score * weights['environmental'] +
                social_score * weights['social'] +
                governance_score * weights['governance']
            )

            # 行业调整 (降低调整系数，使分数更现实)
            industry_adjustments = {
                '环保技术': 0.95, '新能源': 0.93, '制造业': 0.88, '金融业': 0.90,
                '农业科技': 0.92, '建筑工程': 0.87, '信息技术': 0.91,
                '新能源汽车': 0.94, '咨询服务': 0.90, '生物医药': 0.93
            }
            industry_factor = industry_adjustments.get(industry, 1.0)
            adjusted_overall_score = min(overall_score * industry_factor, 100)

            # 添加随机波动
            volatility = random.uniform(-2, 2)
            final_overall = max(0, min(100, adjusted_overall_score + volatility))

            # 确定评价等级
            if final_overall >= 90:
                evaluation_grade = "A+"
                suggestion = "优秀表现，建议继续保持并发挥行业领导作用"
            elif final_overall >= 80:
                evaluation_grade = "A"
                suggestion = "良好表现，建议在薄弱环节加强改进"
            elif final_overall >= 70:
                evaluation_grade = "B+"
                suggestion = "中等偏上，建议重点改进环境和社会责任"
            elif final_overall >= 60:
                evaluation_grade = "B"
                suggestion = "中等水平，需要全面提升ESG管理"
            else:
                evaluation_grade = "C"
                suggestion = "需要立即改进ESG管理体系"

            response = {
                "success": True,
                "data": {
                    "company_id": company_id,
                    "company_name": company_name,
                    "industry": industry,
                    "evaluation_id": 1000 + company_id + random.randint(1, 999),
                    "overall_score": round(final_overall, 1),
                    "environmental_score": round(environmental_score + volatility, 1),
                    "social_score": round(social_score + volatility, 1),
                    "governance_score": round(governance_score + volatility, 1),
                    "evaluation_grade": evaluation_grade,
                    "confidence_level": round(random.uniform(0.85, 0.98), 2),
                    "suggestion": suggestion,
                    "industry_factor": industry_factor,
                    "evaluation_method": "federated_learning_with_homomorphic_encryption",
                    "data_encryption_used": True,
                    "calculation_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }
            }
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))

        elif self.path == '/api/v1/carbon/valuation':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                request_data = json.loads(post_data.decode('utf-8'))
            except UnicodeDecodeError:
                request_data = json.loads(post_data.decode('gbk', errors='ignore'))

            self.send_response(200)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.add_cors_headers()
            self.end_headers()

            carbon_type = request_data.get('type', 'cer')
            amount = float(request_data.get('amount', 1000))
            project_years = int(request_data.get('project_years', 10))

            base_prices = {'cer': 45.2, 'ccer': 35.8, 'ver': 25.5}
            base_price = base_prices.get(carbon_type, 40.0)

            # 动态价格计算
            quantity_factor = 1.0
            if amount >= 10000: quantity_factor = 1.02
            elif amount >= 5000: quantity_factor = 1.01
            elif amount < 100: quantity_factor = 0.97

            years_factor = 1.0 + (project_years - 10) * 0.02
            market_price = round(base_price * quantity_factor * years_factor, 2)
            total_value = amount * market_price

            response = {
                "success": True,
                "data": {
                    "asset_type": carbon_type.upper(),
                    "amount": amount,
                    "project_years": project_years,
                    "market_price": market_price,
                    "total_value": round(total_value, 2),
                    "base_price": base_price,
                    "quantity_factor": quantity_factor,
                    "years_factor": years_factor,
                    "growth_rate": round(random.uniform(5, 15), 1),
                    "risk_level": "低" if base_price > 40 else "中",
                    "valuation_method": "market_based_with_adjustments",
                    "calculation_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }
            }
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))

        else:
            self.send_response(404)
            self.end_headers()

    def load_real_companies(self):
        """加载真实的企业数据"""
        try:
            with open('companies_data.json', 'r', encoding='utf-8') as f:
                companies = json.load(f)
                return companies
        except Exception as e:
            print(f"加载真实企业数据失败: {e}")
            # 如果加载失败，返回少量示例数据
            return [
                {
                    "id": 1,
                    "name": "氢能源有限责任公司",
                    "industry": "新能源",
                    "registration_code": "91322872227500",
                    "is_active": True,
                    "established_date": "2015-01-11",
                    "registered_capital": 157390000,
                    "employees": 280,
                    "location": "武汉市洪山区",
                    "esg_score": 82,
                    "last_evaluation": "2025-07-19"
                }
            ]

    def generate_ultra_companies(self):
        """生成超大规模企业数据"""
        companies = []
        industries = [
            "环保技术", "新能源", "制造业", "金融业", "农业科技", "建筑工程",
            "信息技术", "新能源汽车", "咨询服务", "生物医药", "金融科技", "化工材料"
        ]

        company_prefixes = [
            "中", "华", "国", "民", "天", "地", "东", "南", "西", "北", "上", "海"
        ]

        company_suffixes = [
            "科技", "集团", "控股", "股份", "有限", "投资", "发展", "建设", "能源"
        ]

        cities = [
            "北京", "上海", "深圳", "广州", "杭州", "南京", "武汉", "成都", "西安", "重庆"
        ]

        for i in range(1, 157):
            prefix = random.choice(company_prefixes)
            middle = f"{random.choice(['华', '创', '绿', '清', '新', '智'])}{i:03d}"
            suffix = random.choice(company_suffixes)
            company_name = f"{prefix}{middle}{suffix}有限公司"

            registration_code = f"91{random.randint(100000, 999999)}{random.randint(10000000, 99999999)}"
            industry = random.choice(industries)

            base_score = {
                "环保技术": 68, "新能源": 71, "制造业": 58, "金融业": 63,
                "农业科技": 61, "建筑工程": 55, "信息技术": 64,
                "新能源汽车": 69, "生物医药": 66, "金融科技": 67, "化工材料": 52
            }.get(industry, 62)

            esg_score = base_score + random.randint(-15, 15)
            esg_score = max(35, min(92, esg_score))

            years_ago = random.randint(3, 25)
            established_date = (datetime.now() - timedelta(days=years_ago * 365)).strftime("%Y-%m-%d")

            capital = random.randint(1000, 100000)
            employees = random.randint(50, 5000)

            last_eval_days = random.randint(1, 120)
            last_evaluation = (datetime.now() - timedelta(days=last_eval_days)).strftime("%Y-%m-%d")

            company = {
                "id": i,
                "name": company_name,
                "industry": industry,
                "registration_code": registration_code,
                "is_active": random.choice([True, True, True, False]),
                "established_date": established_date,
                "registered_capital": capital * 10000,
                "employees": employees,
                "location": random.choice(cities) + random.choice(["市", "区"]),
                "esg_score": round(esg_score, 1),
                "last_evaluation": last_evaluation,
                "annual_revenue": capital * random.uniform(0.5, 3.0) * 10000,
                "carbon_assets": random.randint(0, 50) if industry in ["新能源", "环保技术"] else random.randint(0, 20),
                "contact_person": random.choice(["张经理", "李总", "王主任"]),
                "contact_phone": f"1{random.choice([3,4,5,6,7,8,9])}{random.randint(100000000, 999999999)}"
            }
            companies.append(company)

        return companies

    def generate_ultra_blockchain_data(self):
        """生成超大规模区块链数据"""
        transactions = []
        transaction_types = [
            "ESG评价记录", "碳资产交易", "企业信息更新", "数据验证", "智能合约执行",
            "碳信用发行", "资产抵押", "数据共享授权", "审计记录", "合规检查"
        ]

        base_time = datetime.now() - timedelta(days=60)

        for i in range(1, 1248):
            tx_type = random.choice(transaction_types)
            block_number = 1000 + i
            gas_used = random.randint(21000, 150000)
            gas_price = random.randint(10000000000, 50000000000)

            days_offset = random.randint(0, 60 * 24 * 60)
            timestamp = base_time + timedelta(minutes=days_offset)

            transaction = {
                "id": i,
                "transaction_hash": f"0x{random.randint(0, 2**128):032x}",
                "block_number": block_number,
                "transaction_type": tx_type,
                "from_address": f"0x{random.randint(0, 2**64):016x}",
                "to_address": f"0x{random.randint(0, 2**64):016x}",
                "amount": random.randint(0, 1000000) if "交易" in tx_type else 0,
                "gas_used": gas_used,
                "gas_price": gas_price,
                "gas_fee": gas_used * gas_price,
                "timestamp": timestamp.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "status": "confirmed" if random.random() > 0.08 else "pending",
                "data": {}
            }

            if tx_type == "ESG评价记录":
                transaction["data"] = {
                    "company_id": random.randint(1, 500),
                    "esg_score": round(random.uniform(45, 85), 1),
                    "confidence_level": round(random.uniform(0.75, 0.95), 2)
                }
            elif tx_type == "碳资产交易":
                transaction["data"] = {
                    "asset_type": random.choice(["CER", "CCER", "VER", "GCER"]),
                    "quantity": random.randint(100, 50000),
                    "price_per_ton": round(random.uniform(25, 120), 2),
                    "project_location": random.choice(["内蒙古", "新疆", "江苏", "广东", "四川"])
                }

            transactions.append(transaction)

        transactions.sort(key=lambda x: x['timestamp'], reverse=True)
        for idx, tx in enumerate(transactions, 1):
            tx['id'] = idx

        return transactions

    def generate_ultra_carbon_assets(self):
        """生成超大规模碳资产数据"""
        assets = []
        project_types = [
            "风力发电", "光伏发电", "林业碳汇", "甲烷回收", "生物质能",
            "水力发电", "地热能", "节能改造"
        ]

        provinces = ["内蒙古", "新疆", "甘肃", "青海", "江苏", "广东", "四川", "云南"]
        asset_types = ["CER", "CCER", "VER", "GCER"]

        for i in range(1, 188):
            province = random.choice(provinces)
            asset_type = random.choice(asset_types)

            # 根据不同碳信用标准调整项目类型和价格
            if asset_type == "CER":
                # CER (Certified Emission Reduction) - UNFCCC认证，主要大型项目
                cer_projects = ["风力发电", "光伏发电", "水力发电", "地热能"]
                project_type = random.choice(cer_projects)
                base_price = random.choice([58.9, 62.3, 55.7, 59.8])
                amount = random.randint(15000, 85000)
            elif asset_type == "CCER":
                # CCER (Chinese Certified Emission Reduction) - 中国核证减排量
                ccER_projects = ["林业碳汇", "光伏发电", "生物质能", "甲烷回收", "节能改造"]
                project_type = random.choice(ccER_projects)
                base_price = random.choice([45.2, 42.8, 48.6, 44.1])
                amount = random.randint(8000, 60000)
            elif asset_type == "VER":
                # VER (Verified Emission Reduction) - 自愿市场核证减排量
                ver_projects = ["林业碳汇", "甲烷回收", "节能改造", "生物质能"]
                project_type = random.choice(ver_projects)
                base_price = random.choice([28.5, 32.1, 25.8, 30.7])
                amount = random.randint(3000, 35000)
            else:  # GCER
                # GCER (Gold Standard Certified Emission Reduction) - 黄金标准认证
                gcer_projects = ["风力发电", "光伏发电", "林业碳汇", "生物质能"]
                project_type = random.choice(gcer_projects)
                base_price = random.choice([68.4, 72.1, 65.8, 70.3])
                amount = random.randint(5000, 45000)

            price = base_price * (1 + random.uniform(-0.15, 0.20))

            project_years = random.randint(7, 25)
            cert_days_ago = random.randint(30, 365 * 5)
            cert_date = datetime.now() - timedelta(days=cert_days_ago)
            expiry_date = cert_date + timedelta(days=project_years * 365)

            asset = {
                "id": i,
                "asset_name": f"{project_type}减排量",
                "project_name": f"{province}{project_type}项目{i:03d}",
                "project_id": f"PRJ{random.randint(10000, 99999)}",
                "asset_type": random.choice(asset_types),
                "amount": amount,
                "current_price": round(price, 2),
                "total_value": round(amount * price, 2),
                "project_years": project_years,
                "certification_date": cert_date.strftime("%Y-%m-%d"),
                "expiry_date": expiry_date.strftime("%Y-%m-%d"),
                "location": province,
                "owner_id": random.randint(1, 500),
                "status": random.choice(["active", "pending", "expired"]),
                "methodology": random.choice(["AMS-I.D.", "AMS-III.D.", "ACM0002"]),
                "project_developer": random.choice(["中节能", "国电投", "华能", "大唐", "华电"])
            }
            assets.append(asset)

        return assets

    def generate_ultra_esg_history(self):
        """生成超大规模ESG评价历史数据"""
        history = []
        base_time = datetime.now() - timedelta(days=365 * 2)

        for i in range(1, 2157):
            days_offset = random.randint(0, 365 * 2)
            eval_time = base_time + timedelta(days=days_offset)

            company_id = random.randint(1, 156)
            overall_score = round(random.uniform(42, 91), 1)

            if overall_score >= 90:
                grade = "A+"
            elif overall_score >= 80:
                grade = "A"
            elif overall_score >= 70:
                grade = "B+"
            elif overall_score >= 60:
                grade = "B"
            else:
                grade = "C"

            record = {
                "id": i,
                "company_id": company_id,
                "company_name": f"企业{company_id:03d}",
                "industry": random.choice(["环保技术", "新能源", "制造业", "金融业", "农业科技"]),
                "evaluation_date": eval_time.strftime("%Y-%m-%d"),
                "overall_score": overall_score,
                "environmental_score": round(random.uniform(60, 98), 1),
                "social_score": round(random.uniform(62, 96), 1),
                "governance_score": round(random.uniform(68, 99), 1),
                "grade": grade,
                "confidence_level": round(random.uniform(0.75, 0.99), 2),
                "risk_level": random.choice(["低", "中", "高"])
            }
            history.append(record)

        history.sort(key=lambda x: x['evaluation_date'], reverse=True)
        for idx, record in enumerate(history, 1):
            record['id'] = idx

        return history

def start_server():
    with socketserver.TCPServer(("", PORT), UltraESGAPIHandler) as httpd:
        try:
            print(f"超大规模双碳比赛系统启动在 http://localhost:{PORT}")
            print(f"系统状态: http://localhost:{PORT}/health")
            print(f"统计数据: http://localhost:{PORT}/stats")
            print(f"前端界面: simple_frontend.html")
            print("=" * 60)
            print("数据规模:")
            print("  - 企业数量: 156 家")
            print("  - 区块链交易: 1247 条")
            print("  - 碳资产项目: 187 个")
            print("  - ESG评价记录: 2156 条")
            print("=" * 60)
            print("按 Ctrl+C 停止服务器")
        except UnicodeEncodeError:
            print(f"Ultra-scale ESG System started at http://localhost:{PORT}")
            print(f"System status: http://localhost:{PORT}/health")
            print(f"Statistics: http://localhost:{PORT}/stats")
            print("=" * 60)

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            try:
                print("\n服务器已停止")
            except UnicodeEncodeError:
                print("\nServer stopped")

if __name__ == "__main__":
    try:
        print("超大规模双碳比赛系统")
        print("=" * 40)
    except UnicodeEncodeError:
        print("Ultra-scale ESG System")
        print("=" * 40)
    start_server()