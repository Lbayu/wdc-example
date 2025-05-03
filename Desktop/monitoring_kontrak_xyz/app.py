import streamlit as st
import pandas as pd
import joblib
from datetime import datetime
import matplotlib.pyplot as plt
import plotly.express as px  # ⬅️ Tambahan untuk bar chart interaktif

# Judul
st.title("📊 Prediksi Risiko & Prioritas Kontrak XYZ")

# Upload file CSV
uploaded_file = st.file_uploader("Upload data kontrak (CSV)", type=["csv"])
if uploaded_file is not None:
    df = pd.read_csv(uploaded_file)

    # Pra-pemrosesan
    df['Tanggal Mulai Kontrak'] = pd.to_datetime(df['Tanggal Mulai Kontrak'])
    df['Tanggal Berakhir Kontrak'] = pd.to_datetime(df['Tanggal Berakhir Kontrak'])
    df['Durasi Kontrak (hari)'] = (df['Tanggal Berakhir Kontrak'] - df['Tanggal Mulai Kontrak']).dt.days

    df['Nilai Kontrak'] = df['Nilai Kontrak (Rp)'].astype(str).str.replace(r'[^\d]', '', regex=True)
    df['Nilai Kontrak'] = pd.to_numeric(df['Nilai Kontrak'], errors='coerce')

    # Hitung Risk Level
    def calculate_risk_level(row):
        nilai = row["Nilai Kontrak"]
        durasi = row["Durasi Kontrak (hari)"]
        delay = row["Delay Perpanjangan (hari)"]
        if nilai > 5_000_000_000 or durasi > 300 or delay > 30:
            return "Tinggi"
        elif (2_000_000_000 <= nilai <= 5_000_000_000) or (150 <= durasi <= 300) or (1 <= delay <= 30):
            return "Sedang"
        else:
            return "Rendah"

    df["Risk Level"] = df.apply(calculate_risk_level, axis=1)

    # Prediksi Prioritas menggunakan model
    try:
        model = joblib.load("model_priority_rf.pkl")
        features = ['Nilai Kontrak', 'Durasi Kontrak (hari)', 'Delay Perpanjangan (hari)']
        df['Prioritas_encoded'] = model.predict(df[features])

        # Load LabelEncoder Prioritas
        le_priority = joblib.load("le_priority.pkl")
        df['Prioritas'] = le_priority.inverse_transform(df['Prioritas_encoded'])

    except Exception as e:
        st.error(f"❌ Gagal memuat model atau encoder: {e}")

    # Prediksi status kontrak (sisa hari)
    today = pd.to_datetime(datetime.today().date())
    df['Predicted_Duration'] = (df['Tanggal Berakhir Kontrak'] - today).dt.days

    def status_durasi(sisa_hari):
        if sisa_hari < 30:
            return 'Sangat Mendesak'
        elif 30 <= sisa_hari <= 90:
            return 'Perlu Monitoring'
        else:
            return 'Masih Aman'

    df['Predicted_Duration_Status'] = df['Predicted_Duration'].apply(status_durasi)

    # ✅ Tampilkan hasil
    st.success("✅ Data berhasil diproses!")
    st.dataframe(df[['Nama Vendor', 'Nilai Kontrak', 'Durasi Kontrak (hari)', 
                     'Delay Perpanjangan (hari)', 'Risk Level', 'Prioritas', 
                     'Predicted_Duration_Status']])

    # 📊 Visualisasi Data
    st.subheader("📊 Jumlah Kontrak per Risk Level")
    st.bar_chart(df['Risk Level'].value_counts())

    if 'Prioritas' in df.columns:
        st.subheader("🧁 Distribusi Prioritas Kontrak")
        priority_counts = df['Prioritas'].value_counts()
        fig, ax = plt.subplots()
        ax.pie(priority_counts, labels=priority_counts.index, autopct='%1.1f%%', startangle=90)
        ax.axis('equal')
        st.pyplot(fig)

    # ✅ Tambahan: Bar Chart Horizontal ala Tableau
    st.subheader("📌 Visualisasi Durasi Kontrak per Vendor berdasarkan Risk Level")
    fig_bar = px.bar(
        df.sort_values('Durasi Kontrak (hari)', ascending=False),
        x='Durasi Kontrak (hari)',
        y='Nama Vendor',
        color='Risk Level',
        orientation='h',
        height=800,
        labels={
            'Durasi Kontrak (hari)': 'Durasi Kontrak (hari)',
            'Nama Vendor': 'Nama Vendor',
            'Risk Level': 'Tingkat Risiko'
        },
        color_discrete_map={
            'Rendah': '#1f77b4',
            'Sedang': '#ff7f0e',
            'Tinggi': '#d62728'
        }
    )
    st.plotly_chart(fig_bar, use_container_width=True)

    # 📈 Line Chart Prediksi Sisa Hari
    st.subheader("📈 Prediksi Sisa Hari Kontrak per Vendor")
    line_data = df[['Nama Vendor', 'Predicted_Duration']].set_index('Nama Vendor')
    st.line_chart(line_data)

    # 📥 Unduh hasil
    csv = df.to_csv(index=False).encode('utf-8')
    st.download_button("📥 Unduh hasil sebagai CSV", data=csv, file_name="hasil_prediksi.csv", mime='text/csv')

else:
    st.info("📂 Silakan upload file CSV terlebih dahulu untuk mulai analisis.")
