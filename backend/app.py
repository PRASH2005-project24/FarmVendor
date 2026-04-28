import os
from urllib.parse import urlparse
from dotenv import load_dotenv
load_dotenv()

import logging
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from mysql.connector import pooling

# ─── Logging ─────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

# ─── App Setup ───────────────────────────────────────────
# Serve React build from frontend/dist in production
static_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend', 'dist')
app = Flask(__name__, static_folder=static_folder, static_url_path='')
CORS(app, origins=['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', '*'])

# ─── Database Connection Pool ────────────────────────────
db_config = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'port': int(os.environ.get('DB_PORT', 3306)),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', ''),
    'database': os.environ.get('DB_NAME', 'farmer_vendor_db'),
}

if db_config['host'] != 'localhost' and db_config['host'] != '127.0.0.1':
    db_config['ssl_disabled'] = False
    db_config['ssl_verify_cert'] = False
    db_config['ssl_verify_identity'] = False

try:
    pool = pooling.MySQLConnectionPool(
        pool_name="farmer_pool",
        pool_size=5,
        pool_reset_session=True,
        **db_config
    )
    logger.info("✅ Database connection pool created successfully")
except Exception as e:
    logger.error(f"❌ Failed to create DB pool: {e}")
    pool = None


def get_db():
    if pool is None:
        raise Exception("Database pool is not initialized")
    return pool.get_connection()

@app.route('/debug-db')
def debug_db():
    if pool is not None:
        return jsonify({"status": "Pool is initialized and working"}), 200
    try:
        tmp_pool = pooling.MySQLConnectionPool(
            pool_name="test_pool", pool_size=1, pool_reset_session=True, **db_config
        )
        return jsonify({"status": "Created successfully via debug route"}), 200
    except Exception as e:
        return jsonify({
            "error": str(e),
            "host": db_config['host'],
            "port": db_config['port'],
            "user": db_config['user'],
            "database": db_config['database']
        }), 500


def gen_id(prefix, table):
    """Generate next ID like F3, P4, S6 etc."""
    conn = get_db()
    cursor = conn.cursor()
    id_col = {
        'farmer': 'farmer_id', 'land': 'land_id', 'crop': 'crop_id',
        'product': 'product_id', 'sales': 'sale_id', 'expense': 'expense_id',
        'harvest': 'harvest_id', 'activity': 'activity_id',
        'fertilizer_dosage': 'dosage_id', 'soil_report': 'report_id',
        'exporter': 'exporter_id'
    }[table]
    # Get ALL IDs and find the true maximum number to avoid duplicates
    cursor.execute(f"SELECT {id_col} FROM {table}")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    max_num = 0
    for row in rows:
        if row[0]:
            digits = ''.join(filter(str.isdigit, row[0]))
            if digits:
                max_num = max(max_num, int(digits))
    return f"{prefix}{max_num + 1}"


# ─── Helper: Build ORDER BY from query params ───────────
ALLOWED_SORT = {
    'farmer': ['name', 'location', 'farmer_id', 'created_at'],
    'land': ['area', 'location', 'farmer_id', 'land_id', 'soil_type', 'created_at'],
    'crop': ['crop_name', 'season', 'crop_id', 'created_at'],
    'product': ['product_name', 'product_id', 'created_at'],
    'sales': ['sale_date', 'price', 'quantity_Kg', 'sale_id', 'created_at'],
    'expense': ['amount', 'expense_date', 'type', 'expense_id', 'created_at'],
    'harvest': ['profit', 'harvest_date', 'yield_amount', 'harvest_id', 'total_cost', 'created_at'],
    'activity': ['chemical_name', 'quantity', 'activity_date', 'activity_id', 'land_id', 'created_at'],
    'fertilizer_dosage': ['fertilizer_name', 'quantity', 'application_stage', 'dosage_id', 'created_at'],
    'exporter': ['exporter_name', 'exporter_type', 'crop_product', 'current_rate', 'distance_km', 'created_at'],
    'soil_report': ['ph_level', 'report_date', 'report_id', 'created_at'],
}

def get_sort_clause(table, default='created_at', prefix=''):
    sort_by = request.args.get('sort_by', default)
    order = request.args.get('order', 'desc').upper()
    if order not in ('ASC', 'DESC'):
        order = 'DESC'
    if sort_by not in ALLOWED_SORT.get(table, []):
        sort_by = default
    col = f"{prefix}.{sort_by}" if prefix else sort_by
    return f" ORDER BY {col} {order}"


# ─── System Routes ───────────────────────────────────────

@app.route('/')
def home():
    # Serve React app in production, API info in dev
    if os.path.exists(os.path.join(static_folder, 'index.html')):
        return send_from_directory(static_folder, 'index.html')
    return jsonify({"status": "ok", "message": "Farmer Vendor Management System API 🌾"})


@app.route('/health')
def health():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        cursor.close()
        conn.close()
        return jsonify({"status": "healthy", "database": "connected"}), 200
    except Exception as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 500


# ─── Dashboard Stats ────────────────────────────────────

@app.route('/api/dashboard')
def dashboard():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT COUNT(*) as count FROM farmer")
        total_farmers = cursor.fetchone()['count']

        cursor.execute("SELECT COUNT(*) as count FROM product")
        total_products = cursor.fetchone()['count']

        cursor.execute("SELECT COALESCE(SUM(price * quantity_Kg), 0) as total FROM sales")
        total_revenue = float(cursor.fetchone()['total'])

        cursor.execute("SELECT COALESCE(SUM(amount), 0) as total FROM expense")
        total_expenses = float(cursor.fetchone()['total'])

        cursor.execute("SELECT COUNT(*) as count FROM sales")
        total_sales = cursor.fetchone()['count']

        cursor.execute("SELECT COUNT(*) as count FROM crop")
        total_crops = cursor.fetchone()['count']

        cursor.execute("SELECT COUNT(*) as count FROM harvest")
        total_harvests = cursor.fetchone()['count']

        cursor.execute("SELECT COUNT(*) as count FROM land")
        total_lands = cursor.fetchone()['count']

        cursor.execute("SELECT COUNT(*) as count FROM activity")
        total_activities = cursor.fetchone()['count']

        # Recent sales (last 5)
        cursor.execute("""
            SELECT s.sale_id, s.sale_date, p.product_name, s.quantity_Kg, s.price,
                   (s.price * s.quantity_Kg) as total
            FROM sales s
            JOIN product p ON s.product_id = p.product_id
            ORDER BY s.created_at DESC LIMIT 5
        """)
        recent_sales = cursor.fetchall()
        for r in recent_sales:
            r['sale_date'] = str(r['sale_date'])
            r['quantity_Kg'] = float(r['quantity_Kg'])
            r['price'] = float(r['price'])
            r['total'] = float(r['total'])

        cursor.close()
        conn.close()

        return jsonify({
            "totalFarmers": total_farmers,
            "totalProducts": total_products,
            "totalRevenue": total_revenue,
            "totalExpenses": total_expenses,
            "totalSales": total_sales,
            "totalCrops": total_crops,
            "totalHarvests": total_harvests,
            "totalLands": total_lands,
            "totalActivities": total_activities,
            "netProfit": total_revenue - total_expenses,
            "recentSales": recent_sales
        }), 200
    except Exception as e:
        logger.error(f"Dashboard error: {e}")
        return jsonify({"error": str(e)}), 500


# ─── Farmer Routes ───────────────────────────────────────

@app.route('/api/farmers', methods=['GET', 'POST'])
def handle_farmers():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        if request.method == 'POST':
            data = request.json
            fid = gen_id('F', 'farmer')
            cursor.execute(
                "INSERT INTO farmer (farmer_id, name, location) VALUES (%s, %s, %s)",
                (fid, data['name'], data.get('location', ''))
            )
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"id": fid, "message": "Farmer added"}), 201
        else:
            query = "SELECT * FROM farmer"
            params = []
            # Filter by location
            location = request.args.get('location')
            if location:
                query += " WHERE location LIKE %s"
                params.append(f"%{location}%")
            query += get_sort_clause('farmer')
            cursor.execute(query, params)
            rows = cursor.fetchall()
            for r in rows:
                r['created_at'] = str(r['created_at'])
            cursor.close()
            conn.close()
            return jsonify(rows), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/farmers/<farmer_id>', methods=['PUT', 'DELETE'])
def modify_farmer(farmer_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        if request.method == 'DELETE':
            cursor.execute("DELETE FROM farmer WHERE farmer_id = %s", (farmer_id,))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"message": "Farmer deleted"}), 200
        else:
            data = request.json
            cursor.execute(
                "UPDATE farmer SET name = %s, location = %s WHERE farmer_id = %s",
                (data['name'], data.get('location', ''), farmer_id)
            )
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"message": "Farmer updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Land Routes ─────────────────────────────────────────

@app.route('/api/land', methods=['GET', 'POST'])
def handle_land():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        if request.method == 'POST':
            data = request.json
            lid = gen_id('L', 'land')
            cursor.execute(
                "INSERT INTO land (land_id, area, location, soil_type, farmer_id) VALUES (%s, %s, %s, %s, %s)",
                (lid, data['area'], data.get('location', ''), data.get('soil_type'), data['farmer_id'])
            )
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"id": lid, "message": "Land added"}), 201
        else:
            query = """
                SELECT l.*, f.name as farmer_name
                FROM land l
                LEFT JOIN farmer f ON l.farmer_id = f.farmer_id
            """
            params = []
            filters = []
            farmer_id = request.args.get('farmer_id')
            if farmer_id:
                filters.append("l.farmer_id = %s")
                params.append(farmer_id)
            location = request.args.get('location')
            if location:
                filters.append("l.location LIKE %s")
                params.append(f"%{location}%")
            if filters:
                query += " WHERE " + " AND ".join(filters)
            query += get_sort_clause('land', prefix='l')
            cursor.execute(query, params)
            rows = cursor.fetchall()
            for r in rows:
                r['created_at'] = str(r['created_at'])
            cursor.close()
            conn.close()
            return jsonify(rows), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/land/<land_id>', methods=['PUT', 'DELETE'])
def modify_land(land_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        if request.method == 'DELETE':
            cursor.execute("DELETE FROM land WHERE land_id = %s", (land_id,))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"message": "Land deleted"}), 200
        else:
            data = request.json
            cursor.execute(
                "UPDATE land SET area = %s, location = %s, soil_type = %s, farmer_id = %s WHERE land_id = %s",
                (data['area'], data.get('location', ''), data.get('soil_type'), data['farmer_id'], land_id)
            )
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"message": "Land updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Crop Routes ─────────────────────────────────────────

@app.route('/api/crops', methods=['GET', 'POST'])
def handle_crops():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        if request.method == 'POST':
            data = request.json
            cid = gen_id('C', 'crop')
            cursor.execute(
                "INSERT INTO crop (crop_id, crop_name, season) VALUES (%s, %s, %s)",
                (cid, data['crop_name'], data['season'])
            )
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"id": cid, "message": "Crop added"}), 201
        else:
            query = "SELECT * FROM crop"
            params = []
            season = request.args.get('season')
            if season:
                query += " WHERE season = %s"
                params.append(season)
            query += get_sort_clause('crop')
            cursor.execute(query, params)
            rows = cursor.fetchall()
            for r in rows:
                r['created_at'] = str(r['created_at'])
            cursor.close()
            conn.close()
            return jsonify(rows), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/crops/<crop_id>', methods=['PUT', 'DELETE'])
def modify_crop(crop_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        if request.method == 'DELETE':
            cursor.execute("DELETE FROM crop WHERE crop_id = %s", (crop_id,))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"message": "Crop deleted"}), 200
        else:
            data = request.json
            cursor.execute(
                "UPDATE crop SET crop_name = %s, season = %s WHERE crop_id = %s",
                (data['crop_name'], data['season'], crop_id)
            )
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"message": "Crop updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Product Routes ──────────────────────────────────────

@app.route('/api/products', methods=['GET', 'POST'])
def handle_products():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        if request.method == 'POST':
            data = request.json
            pid = gen_id('P', 'product')
            cursor.execute(
                "INSERT INTO product (product_id, product_name) VALUES (%s, %s)",
                (pid, data['product_name'])
            )
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"id": pid, "message": "Product added"}), 201
        else:
            query = "SELECT * FROM product"
            params = []
            search = request.args.get('search')
            if search:
                query += " WHERE product_name LIKE %s"
                params.append(f"%{search}%")
            query += get_sort_clause('product')
            cursor.execute(query, params)
            rows = cursor.fetchall()
            for r in rows:
                r['created_at'] = str(r['created_at'])
            cursor.close()
            conn.close()
            return jsonify(rows), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/products/<product_id>', methods=['PUT', 'DELETE'])
def modify_product(product_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        if request.method == 'DELETE':
            cursor.execute("DELETE FROM product WHERE product_id = %s", (product_id,))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"message": "Product deleted"}), 200
        else:
            data = request.json
            cursor.execute(
                "UPDATE product SET product_name = %s WHERE product_id = %s",
                (data['product_name'], product_id)
            )
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"message": "Product updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Sales Routes ────────────────────────────────────────

@app.route('/api/sales', methods=['GET', 'POST'])
def handle_sales():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        if request.method == 'POST':
            data = request.json
            sid = gen_id('S', 'sales')
            cursor.execute(
                "INSERT INTO sales (sale_id, sale_date, product_id, quantity_Kg, price) VALUES (%s, %s, %s, %s, %s)",
                (sid, data['sale_date'], data['product_id'], data.get('quantity_Kg', data.get('quantity')), data['price'])
            )
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"id": sid, "message": "Sale recorded"}), 201
        else:
            query = """
                SELECT s.*, p.product_name
                FROM sales s
                LEFT JOIN product p ON s.product_id = p.product_id
            """
            params = []
            filters = []
            product_id = request.args.get('product_id')
            if product_id:
                filters.append("s.product_id = %s")
                params.append(product_id)
            date_from = request.args.get('date_from')
            if date_from:
                filters.append("s.sale_date >= %s")
                params.append(date_from)
            date_to = request.args.get('date_to')
            if date_to:
                filters.append("s.sale_date <= %s")
                params.append(date_to)
            if filters:
                query += " WHERE " + " AND ".join(filters)
            query += get_sort_clause('sales', prefix='s')
            cursor.execute(query, params)
            rows = cursor.fetchall()
            for r in rows:
                r['sale_date'] = str(r['sale_date'])
                r['quantity_Kg'] = float(r['quantity_Kg'])
                r['price'] = float(r['price'])
                r['created_at'] = str(r['created_at'])
            cursor.close()
            conn.close()
            return jsonify(rows), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/sales/<sale_id>', methods=['PUT', 'DELETE'])
def modify_sale(sale_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        if request.method == 'DELETE':
            cursor.execute("DELETE FROM sales WHERE sale_id = %s", (sale_id,))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"message": "Sale deleted"}), 200
        else:
            data = request.json
            cursor.execute(
                "UPDATE sales SET sale_date = %s, product_id = %s, quantity_Kg = %s, price = %s WHERE sale_id = %s",
                (data['sale_date'], data['product_id'], data.get('quantity_Kg', data.get('quantity')), data['price'], sale_id)
            )
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"message": "Sale updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Expense Routes ──────────────────────────────────────

@app.route('/api/expenses', methods=['GET', 'POST'])
def handle_expenses():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        if request.method == 'POST':
            data = request.json
            eid = gen_id('E', 'expense')
            cursor.execute(
                "INSERT INTO expense (expense_id, type, amount, expense_date, land_id) VALUES (%s, %s, %s, %s, %s)",
                (eid, data['type'], data['amount'], data.get('expense_date'), data['land_id'])
            )
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"id": eid, "message": "Expense added"}), 201
        else:
            query = """
                SELECT e.*, l.area as land_area, f.name as farmer_name
                FROM expense e
                LEFT JOIN land l ON e.land_id = l.land_id
                LEFT JOIN farmer f ON l.farmer_id = f.farmer_id
            """
            params = []
            filters = []
            land_id = request.args.get('land_id')
            if land_id:
                filters.append("e.land_id = %s")
                params.append(land_id)
            exp_type = request.args.get('type')
            if exp_type:
                filters.append("e.type LIKE %s")
                params.append(f"%{exp_type}%")
            if filters:
                query += " WHERE " + " AND ".join(filters)
            query += get_sort_clause('expense', prefix='e')
            cursor.execute(query, params)
            rows = cursor.fetchall()
            for r in rows:
                r['amount'] = float(r['amount'])
                r['created_at'] = str(r['created_at'])
                if r.get('expense_date'):
                    r['expense_date'] = str(r['expense_date'])
            cursor.close()
            conn.close()
            return jsonify(rows), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/expenses/<expense_id>', methods=['PUT', 'DELETE'])
def modify_expense(expense_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        if request.method == 'DELETE':
            cursor.execute("DELETE FROM expense WHERE expense_id = %s", (expense_id,))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"message": "Expense deleted"}), 200
        else:
            data = request.json
            cursor.execute(
                "UPDATE expense SET type = %s, amount = %s, expense_date = %s, land_id = %s WHERE expense_id = %s",
                (data['type'], data['amount'], data.get('expense_date'), data['land_id'], expense_id)
            )
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"message": "Expense updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Activity / Chemical Usage Routes ────────────────────

@app.route('/api/activities', methods=['GET', 'POST'])
def handle_activities():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        if request.method == 'POST':
            data = request.json
            aid = gen_id('A', 'activity')
            cursor.execute(
                "INSERT INTO activity (activity_id, crop_id, land_id, chemical_name, quantity, activity_date) VALUES (%s, %s, %s, %s, %s, %s)",
                (aid, data['crop_id'], data.get('land_id'), data['chemical_name'], data['quantity'], data.get('activity_date'))
            )
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"id": aid, "message": "Activity added"}), 201
        else:
            query = """
                SELECT a.*, c.crop_name, c.season, l.area as land_area, l.location as land_location
                FROM activity a
                LEFT JOIN crop c ON a.crop_id = c.crop_id
                LEFT JOIN land l ON a.land_id = l.land_id
            """
            params = []
            filters = []
            crop_id = request.args.get('crop_id')
            if crop_id:
                filters.append("a.crop_id = %s")
                params.append(crop_id)
            chemical = request.args.get('chemical_name')
            if chemical:
                filters.append("a.chemical_name LIKE %s")
                params.append(f"%{chemical}%")
            if filters:
                query += " WHERE " + " AND ".join(filters)
            query += get_sort_clause('activity', prefix='a')
            cursor.execute(query, params)
            rows = cursor.fetchall()
            for r in rows:
                r['created_at'] = str(r['created_at'])
                if r.get('activity_date'):
                    r['activity_date'] = str(r['activity_date'])
            cursor.close()
            conn.close()
            return jsonify(rows), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/activities/<activity_id>', methods=['PUT', 'DELETE'])
def modify_activity(activity_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        if request.method == 'DELETE':
            cursor.execute("DELETE FROM activity WHERE activity_id = %s", (activity_id,))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"message": "Activity deleted"}), 200
        else:
            data = request.json
            cursor.execute(
                "UPDATE activity SET crop_id = %s, land_id = %s, chemical_name = %s, quantity = %s, activity_date = %s WHERE activity_id = %s",
                (data['crop_id'], data.get('land_id'), data['chemical_name'], data['quantity'], data.get('activity_date'), activity_id)
            )
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"message": "Activity updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Harvest Routes ──────────────────────────────────────

@app.route('/api/harvests', methods=['GET', 'POST'])
def handle_harvests():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        if request.method == 'POST':
            data = request.json
            hid = gen_id('H', 'harvest')
            cursor.execute(
                "INSERT INTO harvest (harvest_id, crop_id, yield_amount, total_cost, profit, harvest_date) VALUES (%s, %s, %s, %s, %s, %s)",
                (hid, data['crop_id'], data['yield_amount'], data.get('total_cost', 0), data.get('profit', 0), data.get('harvest_date'))
            )
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"id": hid, "message": "Harvest added"}), 201
        else:
            query = """
                SELECT h.*, c.crop_name, c.season
                FROM harvest h
                LEFT JOIN crop c ON h.crop_id = c.crop_id
            """
            params = []
            filters = []
            crop_id = request.args.get('crop_id')
            if crop_id:
                filters.append("h.crop_id = %s")
                params.append(crop_id)
            season = request.args.get('season')
            if season:
                filters.append("c.season = %s")
                params.append(season)
            if filters:
                query += " WHERE " + " AND ".join(filters)
            query += get_sort_clause('harvest', prefix='h')
            cursor.execute(query, params)
            rows = cursor.fetchall()
            for r in rows:
                if r.get('profit') is not None:
                    r['profit'] = float(r['profit'])
                if r.get('total_cost') is not None:
                    r['total_cost'] = float(r['total_cost'])
                r['created_at'] = str(r['created_at'])
                if r.get('harvest_date'):
                    r['harvest_date'] = str(r['harvest_date'])
            cursor.close()
            conn.close()
            return jsonify(rows), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/harvests/<harvest_id>', methods=['PUT', 'DELETE'])
def modify_harvest(harvest_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        if request.method == 'DELETE':
            cursor.execute("DELETE FROM harvest WHERE harvest_id = %s", (harvest_id,))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"message": "Harvest deleted"}), 200
        else:
            data = request.json
            cursor.execute(
                "UPDATE harvest SET crop_id = %s, yield_amount = %s, total_cost = %s, profit = %s, harvest_date = %s WHERE harvest_id = %s",
                (data['crop_id'], data['yield_amount'], data.get('total_cost', 0), data.get('profit', 0), data.get('harvest_date'), harvest_id)
            )
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"message": "Harvest updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Reports Routes (Stored Procedures) ─────────────────

@app.route('/api/reports/farmer-summary')
def report_farmer_summary():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_farmer_summary')
        rows = []
        for result in cursor.stored_results():
            rows = result.fetchall()
        for r in rows:
            r['total_expense'] = float(r['total_expense'])
            r['total_harvest_profit'] = float(r['total_harvest_profit'])
        cursor.close()
        conn.close()
        return jsonify(rows), 200
    except Exception as e:
        logger.error(f"Report error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/reports/monthly-sales')
def report_monthly_sales():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_monthly_sales_report')
        rows = []
        for result in cursor.stored_results():
            rows = result.fetchall()
        for r in rows:
            r['total_quantity_kg'] = float(r['total_quantity_kg'])
            r['total_revenue'] = float(r['total_revenue'])
        cursor.close()
        conn.close()
        return jsonify(rows), 200
    except Exception as e:
        logger.error(f"Report error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/reports/revenue-by-product')
def report_revenue_by_product():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_revenue_by_product')
        rows = []
        for result in cursor.stored_results():
            rows = result.fetchall()
        for r in rows:
            r['total_quantity_kg'] = float(r['total_quantity_kg'])
            r['total_revenue'] = float(r['total_revenue'])
        cursor.close()
        conn.close()
        return jsonify(rows), 200
    except Exception as e:
        logger.error(f"Report error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/reports/expense-by-land')
def report_expense_by_land():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_expense_by_land')
        rows = []
        for result in cursor.stored_results():
            rows = result.fetchall()
        for r in rows:
            r['total_expense'] = float(r['total_expense'])
        cursor.close()
        conn.close()
        return jsonify(rows), 200
    except Exception as e:
        logger.error(f"Report error: {e}")
        return jsonify({"error": str(e)}), 500


# ─── Audit Log Route ────────────────────────────────────

@app.route('/api/audit-log')
def get_audit_log():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM audit_log ORDER BY log_time DESC LIMIT 50")
        rows = cursor.fetchall()
        for r in rows:
            r['log_time'] = str(r['log_time'])
        cursor.close()
        conn.close()
        return jsonify(rows), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Fertilizer Dosage Routes ────────────────────────────

@app.route('/api/fertilizer-dosages', methods=['GET', 'POST'])
def handle_fertilizer_dosages():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        if request.method == 'POST':
            data = request.json
            did = gen_id('FD', 'fertilizer_dosage')
            cursor.execute(
                "INSERT INTO fertilizer_dosage (dosage_id, crop_id, fertilizer_name, quantity, application_stage, notes) VALUES (%s, %s, %s, %s, %s, %s)",
                (did, data['crop_id'], data['fertilizer_name'], data['quantity'], data.get('application_stage', ''), data.get('notes', ''))
            )
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"id": did, "message": "Fertilizer dosage added"}), 201
        else:
            query = """
                SELECT fd.*, c.crop_name, c.season
                FROM fertilizer_dosage fd
                LEFT JOIN crop c ON fd.crop_id = c.crop_id
            """
            params = []
            filters = []
            crop_id = request.args.get('crop_id')
            if crop_id:
                filters.append("fd.crop_id = %s")
                params.append(crop_id)
            search = request.args.get('search')
            if search:
                filters.append("fd.fertilizer_name LIKE %s")
                params.append(f"%{search}%")
            if filters:
                query += " WHERE " + " AND ".join(filters)
            query += get_sort_clause('fertilizer_dosage', prefix='fd')
            cursor.execute(query, params)
            rows = cursor.fetchall()
            for r in rows:
                r['created_at'] = str(r['created_at'])
            cursor.close()
            conn.close()
            return jsonify(rows), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/fertilizer-dosages/<dosage_id>', methods=['PUT', 'DELETE'])
def modify_fertilizer_dosage(dosage_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        if request.method == 'DELETE':
            cursor.execute("DELETE FROM fertilizer_dosage WHERE dosage_id = %s", (dosage_id,))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"message": "Fertilizer dosage deleted"}), 200
        else:
            data = request.json
            cursor.execute(
                "UPDATE fertilizer_dosage SET crop_id = %s, fertilizer_name = %s, quantity = %s, application_stage = %s, notes = %s WHERE dosage_id = %s",
                (data['crop_id'], data['fertilizer_name'], data['quantity'], data.get('application_stage', ''), data.get('notes', ''), dosage_id)
            )
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"message": "Fertilizer dosage updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Exporter / Market Routes ────────────────────────────

@app.route('/api/exporters', methods=['GET', 'POST'])
def handle_exporters():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        if request.method == 'POST':
            data = request.json
            eid = gen_id('EX', 'exporter')
            cursor.execute(
                "INSERT INTO exporter (exporter_id, exporter_name, exporter_type, crop_product, current_rate, rate_unit, location, distance_km, contact) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (eid, data['exporter_name'], data.get('exporter_type', ''), data.get('crop_product', ''),
                 data.get('current_rate', 0), data.get('rate_unit', 'per quintal'),
                 data.get('location', ''), data.get('distance_km', 0), data.get('contact', ''))
            )
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"id": eid, "message": "Exporter added"}), 201
        else:
            query = "SELECT * FROM exporter"
            params = []
            filters = []
            crop_product = request.args.get('crop_product')
            if crop_product:
                filters.append("crop_product LIKE %s")
                params.append(f"%{crop_product}%")
            exporter_type = request.args.get('exporter_type')
            if exporter_type:
                filters.append("exporter_type = %s")
                params.append(exporter_type)
            if filters:
                query += " WHERE " + " AND ".join(filters)
            query += get_sort_clause('exporter')
            cursor.execute(query, params)
            rows = cursor.fetchall()
            for r in rows:
                if r.get('current_rate') is not None:
                    r['current_rate'] = float(r['current_rate'])
                if r.get('distance_km') is not None:
                    r['distance_km'] = float(r['distance_km'])
                r['created_at'] = str(r['created_at'])
            cursor.close()
            conn.close()
            return jsonify(rows), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/exporters/<exporter_id>', methods=['PUT', 'DELETE'])
def modify_exporter(exporter_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        if request.method == 'DELETE':
            cursor.execute("DELETE FROM exporter WHERE exporter_id = %s", (exporter_id,))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"message": "Exporter deleted"}), 200
        else:
            data = request.json
            cursor.execute(
                "UPDATE exporter SET exporter_name = %s, exporter_type = %s, crop_product = %s, current_rate = %s, rate_unit = %s, location = %s, distance_km = %s, contact = %s WHERE exporter_id = %s",
                (data['exporter_name'], data.get('exporter_type', ''), data.get('crop_product', ''),
                 data.get('current_rate', 0), data.get('rate_unit', 'per quintal'),
                 data.get('location', ''), data.get('distance_km', 0), data.get('contact', ''), exporter_id)
            )
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"message": "Exporter updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Soil Report Routes ─────────────────────────────────

@app.route('/api/soil-reports', methods=['GET', 'POST'])
def handle_soil_reports():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        if request.method == 'POST':
            data = request.json
            rid = gen_id('SR', 'soil_report')
            cursor.execute(
                "INSERT INTO soil_report (report_id, land_id, ph_level, nitrogen, phosphorus, potassium, organic_carbon, report_date, notes) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (rid, data['land_id'], data.get('ph_level'), data.get('nitrogen'), data.get('phosphorus'),
                 data.get('potassium'), data.get('organic_carbon'), data.get('report_date'), data.get('notes', ''))
            )
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"id": rid, "message": "Soil report added"}), 201
        else:
            query = """
                SELECT sr.*, l.area as land_area, l.location as land_location, f.name as farmer_name
                FROM soil_report sr
                LEFT JOIN land l ON sr.land_id = l.land_id
                LEFT JOIN farmer f ON l.farmer_id = f.farmer_id
            """
            params = []
            filters = []
            land_id = request.args.get('land_id')
            if land_id:
                filters.append("sr.land_id = %s")
                params.append(land_id)
            if filters:
                query += " WHERE " + " AND ".join(filters)
            query += get_sort_clause('soil_report', prefix='sr')
            cursor.execute(query, params)
            rows = cursor.fetchall()
            for r in rows:
                for key in ['ph_level', 'nitrogen', 'phosphorus', 'potassium', 'organic_carbon']:
                    if r.get(key) is not None:
                        r[key] = float(r[key])
                r['created_at'] = str(r['created_at'])
                if r.get('report_date'):
                    r['report_date'] = str(r['report_date'])
            cursor.close()
            conn.close()
            return jsonify(rows), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/soil-reports/<report_id>', methods=['PUT', 'DELETE'])
def modify_soil_report(report_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        if request.method == 'DELETE':
            cursor.execute("DELETE FROM soil_report WHERE report_id = %s", (report_id,))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"message": "Soil report deleted"}), 200
        else:
            data = request.json
            cursor.execute(
                "UPDATE soil_report SET land_id = %s, ph_level = %s, nitrogen = %s, phosphorus = %s, potassium = %s, organic_carbon = %s, report_date = %s, notes = %s WHERE report_id = %s",
                (data['land_id'], data.get('ph_level'), data.get('nitrogen'), data.get('phosphorus'),
                 data.get('potassium'), data.get('organic_carbon'), data.get('report_date'), data.get('notes', ''), report_id)
            )
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"message": "Soil report updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Notification Routes ────────────────────────────────

@app.route('/api/notifications', methods=['GET', 'POST'])
def handle_notifications():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        if request.method == 'POST':
            data = request.json
            cursor.execute(
                "INSERT INTO notification (crop_id, title, message, notify_date) VALUES (%s, %s, %s, %s)",
                (data.get('crop_id'), data['title'], data['message'], data['notify_date'])
            )
            conn.commit()
            nid = cursor.lastrowid
            cursor.close()
            conn.close()
            return jsonify({"id": nid, "message": "Notification created"}), 201
        else:
            query = """
                SELECT n.*, c.crop_name, c.season
                FROM notification n
                LEFT JOIN crop c ON n.crop_id = c.crop_id
            """
            params = []
            filters = []
            is_read = request.args.get('is_read')
            if is_read is not None:
                filters.append("n.is_read = %s")
                params.append(is_read == 'true')
            crop_id = request.args.get('crop_id')
            if crop_id:
                filters.append("n.crop_id = %s")
                params.append(crop_id)
            if filters:
                query += " WHERE " + " AND ".join(filters)
            query += " ORDER BY n.notify_date ASC, n.created_at DESC"
            cursor.execute(query, params)
            rows = cursor.fetchall()
            for r in rows:
                r['notify_date'] = str(r['notify_date'])
                r['created_at'] = str(r['created_at'])
                r['is_read'] = bool(r['is_read'])
            cursor.close()
            conn.close()
            return jsonify(rows), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/notifications/<int:notification_id>/read', methods=['PUT'])
def mark_notification_read(notification_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("UPDATE notification SET is_read = TRUE WHERE notification_id = %s", (notification_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Notification marked as read"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/notifications/<int:notification_id>', methods=['DELETE'])
def delete_notification(notification_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM notification WHERE notification_id = %s", (notification_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Notification deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/notifications/unread-count')
def unread_notification_count():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT COUNT(*) as count FROM notification WHERE is_read = FALSE")
        count = cursor.fetchone()['count']
        cursor.close()
        conn.close()
        return jsonify({"count": count}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Smart Suggestion Routes ────────────────────────────

SOIL_CROP_MAP = {
    'Black Soil': ['Cotton', 'Sugarcane', 'Wheat', 'Jowar', 'Sunflower', 'Soybean'],
    'Alluvial Soil': ['Rice', 'Wheat', 'Sugarcane', 'Maize', 'Pulses', 'Vegetables'],
    'Red Soil': ['Groundnut', 'Millets', 'Tobacco', 'Pulses', 'Potato', 'Tomato'],
    'Laterite Soil': ['Tea', 'Coffee', 'Cashew', 'Rubber', 'Coconut'],
    'Sandy Soil': ['Watermelon', 'Groundnut', 'Jowar', 'Bajra', 'Cucumber'],
    'Clayey Soil': ['Rice', 'Wheat', 'Cabbage', 'Lettuce', 'Broccoli'],
}

FERTILITY_SUGGESTIONS = {
    'Black Soil': {
        'organic': ['Apply compost (5-10 tonnes/hectare)', 'Use poultry waste manure', 'Green manuring with dhaincha/sunhemp', 'Vermicompost application'],
        'chemical': ['Apply Gypsum to improve drainage', 'Zinc Sulphate (25 kg/ha) for zinc deficiency', 'Balanced NPK fertilizers'],
        'tips': ['Avoid waterlogging', 'Deep ploughing in summer improves structure']
    },
    'Alluvial Soil': {
        'organic': ['Cow dung manure (10 tonnes/hectare)', 'Compost from crop residues', 'Bio-fertilizers (Rhizobium, Azotobacter)'],
        'chemical': ['Urea for nitrogen boost', 'Single Super Phosphate (SSP)', 'Potash based on soil test'],
        'tips': ['Already fertile — maintain with crop rotation', 'Avoid over-irrigation']
    },
    'Red Soil': {
        'organic': ['Heavy compost application', 'Poultry waste (2-3 tonnes/hectare)', 'Farmyard manure', 'Mulching to retain moisture'],
        'chemical': ['Lime application to correct acidity', 'Phosphorus-rich fertilizers (DAP)', 'Micronutrients (Iron, Manganese)'],
        'tips': ['Add organic matter regularly', 'Needs irrigation due to low water holding capacity']
    },
    'Laterite Soil': {
        'organic': ['Heavy organic manure application', 'Green manure crops', 'Composted leaves and plant waste'],
        'chemical': ['Lime to reduce acidity', 'NPK fertilizers in higher doses', 'Boron and Molybdenum supplements'],
        'tips': ['Very poor in nutrients — needs heavy fertilization', 'Terrace farming helps prevent erosion']
    },
    'Sandy Soil': {
        'organic': ['Cow dung (15 tonnes/hectare)', 'Poultry waste mixed with soil', 'Vermicompost to improve water retention', 'Biochar application'],
        'chemical': ['Frequent small doses of Urea', 'Calcium Ammonium Nitrate', 'Split fertilizer application recommended'],
        'tips': ['Water drains fast — use drip irrigation', 'Mulching is critical for moisture']
    },
    'Clayey Soil': {
        'organic': ['Add sand + organic matter to improve texture', 'Compost to improve drainage', 'Gypsum application'],
        'chemical': ['Balanced NPK', 'Avoid excess nitrogen — causes compaction', 'Potassium-rich fertilizers'],
        'tips': ['Avoid working when wet', 'Raised beds improve drainage']
    },
}

DISEASE_PESTICIDE_MAP = {
    'Wheat': {
        'Rust (Yellow/Brown)': {'chemical': 'Propiconazole 25% EC (1ml/L water)', 'organic': 'Neem oil spray or Baking soda solution'},
        'Powdery Mildew': {'chemical': 'Sulfur 80% WDG (2g/L water)', 'organic': 'Milk spray (1 part milk to 9 parts water)'},
        'Aphids': {'chemical': 'Imidacloprid 17.8% SL (0.5ml/L water)', 'organic': 'Neem seed kernel extract (NSKE 5%)'}
    },
    'Cotton': {
        'Bollworm': {'chemical': 'Spinosad 45% SC (0.3ml/L water)', 'organic': 'Bacillus thuringiensis (Bt) sprays, Trichogramma cards'},
        'Whitefly': {'chemical': 'Diafenthiuron 50% WP (1g/L water)', 'organic': 'Yellow sticky traps, Neem oil'},
        'Leaf Curl Virus': {'chemical': 'Control vectors (Whiteflies) with Imidacloprid', 'organic': 'Remove infected plants immediately'}
    },
    'Sugarcane': {
        'Red Rot': {'chemical': 'Carbendazim 50% WP seed treatment', 'organic': 'Use disease-free setts, crop rotation'},
        'Shoot Borer': {'chemical': 'Chlorantraniliprole 18.5% SC', 'organic': 'Trichogramma chilonis egg parasitoids'}
    },
    'Rice': {
        'Blast': {'chemical': 'Tricyclazole 75% WP (0.6g/L water)', 'organic': 'Pseudomonas fluorescens (10g/L spray)'},
        'Stem Borer': {'chemical': 'Cartap Hydrochloride 4G (10kg/acre)', 'organic': 'Pheromone traps (8/acre)'}
    }
}

CROP_PROCESS_SOP = {
    'Wheat': [
        {'step': 1, 'title': 'Land Preparation', 'desc': 'Plough the field 2-3 times to achieve a fine tilth. Add well-rotted FYM (Farm Yard Manure).'},
        {'step': 2, 'title': 'Seed Treatment', 'desc': 'Treat seeds with Carboxin + Thiram (2g/kg) to prevent soil-borne diseases.'},
        {'step': 3, 'title': 'Sowing', 'desc': 'Sow during early November. Maintain a depth of 3-5 cm. Line sowing is preferred.'},
        {'step': 4, 'title': 'Irrigation & Fertilizer', 'desc': 'Apply 1st irrigation at Crown Root Initiation (CRI) stage (20-25 days). Top dress with Urea.'},
        {'step': 5, 'title': 'Harvesting', 'desc': 'Harvest when grains become hard and moisture drops to 20%. Typical harvest is April.'}
    ],
    'Cotton': [
        {'step': 1, 'title': 'Deep Ploughing', 'desc': 'Deep ploughing in summer destroys overwintering pests like bollworms.'},
        {'step': 2, 'title': 'Sowing', 'desc': 'Sow after the onset of monsoon (June-July). Maintain proper spacing (e.g. 90x60 cm).'},
        {'step': 3, 'title': 'Nutrient Management', 'desc': 'Apply NPK as a basal dose. Spray 2% DAP at square formation and boll development.'},
        {'step': 4, 'title': 'Pest Management', 'desc': 'Install pheromone traps for pink bollworm early in the season.'},
        {'step': 5, 'title': 'Picking', 'desc': 'Pick fully opened bolls in the morning. Avoid contamination with dry leaves.'}
    ],
    'Sugarcane': [
        {'step': 1, 'title': 'Field Preparation', 'desc': 'Requires deep tillage (50-60 cm) using a subsoiler to break hardpan.'},
        {'step': 2, 'title': 'Sett Treatment', 'desc': 'Dip setts in Carbendazim solution for 15 mins before planting.'},
        {'step': 3, 'title': 'Planting', 'desc': 'Use the trench or ridge-and-furrow method for better water management and to prevent lodging.'},
        {'step': 4, 'title': 'Earthing Up & Tying', 'desc': 'Perform partial earthing up at 3 months and full earthing up at 4-5 months. Tie canes to prevent lodging.'},
        {'step': 5, 'title': 'Harvesting', 'desc': 'Harvest near the ground level using a sharp cane-cutting knife when Brix reading reaches 18-20.'}
    ],
    'Rice': [
        {'step': 1, 'title': 'Nursery Preparation', 'desc': 'Prepare a wet or dry nursery 25-30 days before transplanting.'},
        {'step': 2, 'title': 'Puddling', 'desc': 'Puddle the main field 2-3 times and level it to reduce water percolation.'},
        {'step': 3, 'title': 'Transplanting', 'desc': 'Transplant 2-3 seedlings per hill at a shallow depth (2-3 cm).'},
        {'step': 4, 'title': 'Water Management', 'desc': 'Maintain 2-5 cm of water during the tillering and flowering stages. Drain 10 days before harvest.'},
        {'step': 5, 'title': 'Harvesting', 'desc': 'Harvest when 80% of the panicles turn straw-colored.'}
    ]
}


@app.route('/api/suggestions/crops-by-soil')
def suggest_crops_by_soil():
    soil_type = request.args.get('soil_type', '')
    crops = SOIL_CROP_MAP.get(soil_type, [])
    return jsonify({"soil_type": soil_type, "recommended_crops": crops}), 200


@app.route('/api/suggestions/fertility')
def suggest_fertility():
    soil_type = request.args.get('soil_type', '')
    suggestions = FERTILITY_SUGGESTIONS.get(soil_type, {})
    return jsonify({"soil_type": soil_type, "suggestions": suggestions}), 200


@app.route('/api/recommendations')
def data_recommendations():
    """Recommend best crops based on past harvest profit data."""
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT c.crop_id, c.crop_name, c.season,
                   COUNT(h.harvest_id) as harvest_count,
                   COALESCE(AVG(h.profit), 0) as avg_profit,
                   COALESCE(SUM(h.profit), 0) as total_profit,
                   COALESCE(AVG(h.total_cost), 0) as avg_cost
            FROM crop c
            LEFT JOIN harvest h ON c.crop_id = h.crop_id
            GROUP BY c.crop_id, c.crop_name, c.season
            HAVING harvest_count > 0
            ORDER BY avg_profit DESC
        """)
        rows = cursor.fetchall()
        for r in rows:
            r['avg_profit'] = float(r['avg_profit'])
            r['total_profit'] = float(r['total_profit'])
            r['avg_cost'] = float(r['avg_cost'])
        cursor.close()
        conn.close()
        return jsonify(rows), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/guide/disease', methods=['GET'])
def get_disease_guide():
    return jsonify(DISEASE_PESTICIDE_MAP), 200

@app.route('/api/guide/process', methods=['GET'])
def get_process_guide():
    return jsonify(CROP_PROCESS_SOP), 200


@app.route('/api/smart-suggestions/<farmer_id>')
def farmer_smart_suggestions(farmer_id):
    """Suggest best crop based on overall profit data and the specific farmer's soil type."""
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        # 1. Get farmer's lands and soil types
        cursor.execute("SELECT soil_type FROM land WHERE farmer_id = %s AND soil_type IS NOT NULL", (farmer_id,))
        lands = cursor.fetchall()
        soil_types = [l['soil_type'] for l in lands if l['soil_type']]
        
        # 2. Get most profitable crops based on expenses history (ROI)
        cursor.execute("""
            SELECT c.crop_name, 
                   SUM(h.total_cost) as total_cost,
                   SUM(h.profit) as total_profit,
                   (SUM(h.profit) / NULLIF(SUM(h.total_cost), 1)) * 100 as roi_percentage
            FROM harvest h
            JOIN crop c ON h.crop_id = c.crop_id
            GROUP BY c.crop_name
            ORDER BY roi_percentage DESC
        """)
        profitable_crops = cursor.fetchall()
        
        cursor.close()
        conn.close()

        basis = ""
        recommended_crop = ""

        if not soil_types:
            recommended_crop = profitable_crops[0]['crop_name'] if profitable_crops else "Wheat"
            basis = "Please update your land records with soil types for personalized suggestions. Based on historical expenses and profit data, this is currently the most efficient crop."
        else:
            soil = soil_types[0]
            suitable_crops = SOIL_CROP_MAP.get(soil, ["Mixed Crops"])
            
            # Find the highest ROI crop that is also suitable for this soil
            best_match = None
            for pc in profitable_crops:
                if pc['crop_name'] in suitable_crops:
                    best_match = pc
                    break
            
            if best_match:
                recommended_crop = best_match['crop_name']
                roi = float(best_match['roi_percentage'] or 0)
                profit_str = f"₹{best_match['total_profit']:,.2f}"
                cost_str = f"₹{best_match['total_cost']:,.2f}"
                basis = f"Based on your {soil}, {recommended_crop} is highly recommended. Analysis of historical crop expenses (Cost: {cost_str}) vs Profit ({profit_str}) shows it yields the highest Return on Investment ({roi:.1f}%) for this soil type."
            else:
                recommended_crop = suitable_crops[0]
                basis = f"Based on your {soil}, we recommend sowing {recommended_crop} as it thrives in this soil type."
            
        return jsonify({
            "farmer_id": farmer_id,
            "recommended_crop": recommended_crop,
            "basis": basis
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Error Handlers ──────────────────────────────────────

@app.errorhandler(404)
def not_found(e):
    # For non-API routes, serve React app (client-side routing)
    if not request.path.startswith('/api/'):
        if os.path.exists(os.path.join(static_folder, 'index.html')):
            return send_from_directory(static_folder, 'index.html')
    return jsonify({"error": "Route not found"}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500


# ─── Run ─────────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)
