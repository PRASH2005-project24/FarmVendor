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


def gen_id(prefix, table):
    """Generate next ID like F3, P4, S6 etc."""
    conn = get_db()
    cursor = conn.cursor()
    id_col = {
        'farmer': 'farmer_id', 'land': 'land_id', 'crop': 'crop_id',
        'product': 'product_id', 'sales': 'sale_id', 'expense': 'expense_id',
        'harvest': 'harvest_id'
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
    'land': ['area', 'location', 'farmer_id', 'land_id', 'created_at'],
    'crop': ['crop_name', 'season', 'crop_id', 'created_at'],
    'product': ['product_name', 'product_id', 'created_at'],
    'sales': ['sale_date', 'price', 'quantity_Kg', 'sale_id', 'created_at'],
    'expense': ['amount', 'expense_date', 'type', 'expense_id', 'created_at'],
    'harvest': ['profit', 'harvest_date', 'yield_amount', 'harvest_id', 'created_at'],
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
                "INSERT INTO land (land_id, area, location, farmer_id) VALUES (%s, %s, %s, %s)",
                (lid, data['area'], data.get('location', ''), data['farmer_id'])
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
                "UPDATE land SET area = %s, location = %s, farmer_id = %s WHERE land_id = %s",
                (data['area'], data.get('location', ''), data['farmer_id'], land_id)
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
                "INSERT INTO harvest (harvest_id, crop_id, yield_amount, profit, harvest_date) VALUES (%s, %s, %s, %s, %s)",
                (hid, data['crop_id'], data['yield_amount'], data.get('profit', 0), data.get('harvest_date'))
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
                if r.get('profit'):
                    r['profit'] = float(r['profit'])
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
                "UPDATE harvest SET crop_id = %s, yield_amount = %s, profit = %s, harvest_date = %s WHERE harvest_id = %s",
                (data['crop_id'], data['yield_amount'], data.get('profit', 0), data.get('harvest_date'), harvest_id)
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
