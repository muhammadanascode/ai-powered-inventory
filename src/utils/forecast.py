import pandas as pd
from prophet import Prophet
import mysql.connector
import orjson

def get_predictions(account_id):
    try:
        # Connect to MySQL
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='Anas3434@',
            database='ai-powered-inventory',
            use_pure=True
        )

        query = """
        SELECT 
            oi.product_id,
            YEAR(o.created_at) AS year,
            MONTH(o.created_at) AS month,
            SUM(oi.quantity) AS total_sold
        FROM order_items oi
        JOIN Orders o ON oi.order_id = o.order_id
        WHERE o.account_id = %s
        GROUP BY oi.product_id, YEAR(o.created_at), MONTH(o.created_at)
        ORDER BY oi.product_id, year, month
        """

        df = pd.read_sql(query, conn, params=(account_id,))
        conn.close()

        predictions = {}

        for product_id in df['product_id'].unique():
            prod_df = df[df['product_id'] == product_id].copy()
            prod_df['ds'] = pd.to_datetime(prod_df[['year', 'month']].assign(day=1))
            prod_df = prod_df[['ds', 'total_sold']].rename(columns={'total_sold': 'y'})

            if prod_df.empty or len(prod_df) < 2:
                continue

            model = Prophet()
            model.fit(prod_df)

            future = model.make_future_dataframe(periods=1, freq='M')
            forecast = model.predict(future)

            predictions[str(product_id)] = forecast[['ds', 'yhat']].tail(1).to_dict(orient='records')

        # Convert timestamps to strings
        for key in predictions:
            predictions[key] = [
                {
                    "ds": entry["ds"].strftime("%Y-%m-%d"),
                    "yhat": entry["yhat"]
                }
                for entry in predictions[key]
            ]

        return orjson.dumps(predictions).decode()

    except mysql.connector.Error as db_err:
        return orjson.dumps({"error": f"MySQL error: {str(db_err)}"}).decode()

    except Exception as e:
        return orjson.dumps({"error": f"Unexpected error: {str(e)}"}).decode()


# Optional: Command-line interface
if __name__ == "__main__":
        account_id = 4
        print(get_predictions(account_id))
    
