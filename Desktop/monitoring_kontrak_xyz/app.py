import streamlit as st
import pandas as pd
import joblib
import matplotlib.pyplot as plt
from datetime import datetime
import plotly.express as px
from plotly.io import to_image

# Judul
st.title("\ud83d\udcca Prediksi Risiko & Prioritas Kontrak XYZ")

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
        st.error(f"\u274c Gagal memuat model atau encoder: {e}")

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

    # \u2705 Tampilkan hasil
    st.success("\u2705 Data berhasil diproses!")
    st.dataframe(df[['Nama Vendor', 'Nilai Kontrak', 'Durasi Kontrak (hari)', 
                     'Delay Perpanjangan (hari)', 'Risk Level', 'Prioritas', 
                     'Predicted_Duration_Status']])

    # \ud83d\udcca Visualisasi Data
    st.subheader("\ud83d\udcca Jumlah Kontrak per Risk Level")
    st.bar_chart(df['Risk Level'].value_counts())

    if 'Prioritas' in df.columns:
        st.subheader("\ud83e\uded1 Distribusi Prioritas Kontrak")
        priority_counts = df['Prioritas'].value_counts()
        fig1, ax1 = plt.subplots()
        ax1.pie(priority_counts, labels=priority_counts.index, autopct='%1.1f%%', startangle=90)
        ax1.axis('equal')
        st.pyplot(fig1)

    # \ud83d\udcc8 Visualisasi Durasi Kontrak (rinci dan interaktif)
    st.subheader("\ud83d\udcc8 Durasi Kontrak per Vendor (Horizontal Bar)")
    sort_order = st.radio("Urutkan berdasarkan durasi kontrak:", ["Terpanjang ke Terpendek", "Terpendek ke Terpanjang"])
    ascending = sort_order == "Terpendek ke Terpanjang"

    # Tambahkan filter interaktif
    st.sidebar.header("\ud83d\udd0d Filter Vendor & Risk Level")
    selected_vendors = st.sidebar.multiselect("Pilih Vendor:", df['Nama Vendor'].unique(), default=df['Nama Vendor'].unique())
    selected_risks = st.sidebar.multiselect("Pilih Risk Level:", df['Risk Level'].unique(), default=df['Risk Level'].unique())

    df_filtered = df[(df['Nama Vendor'].isin(selected_vendors)) & (df['Risk Level'].isin(selected_risks))]

    df_filtered['Label Vendor'] = df_filtered['Nama Vendor'] + " | " + df_filtered['Nomor Kontrak'].astype(str) + " | " + df_filtered['Jenis Pengadaan']

    fig2 = px.bar(
        df_filtered.sort_values(by="Durasi Kontrak (hari)", ascending=ascending),
        x="Durasi Kontrak (hari)",
        y="Label Vendor",
        color="Risk Level",
        orientation="h",
        hover_data={
            "Jenis Pengadaan": True,
            "Nama Vendor": True,
            "Nomor Kontrak": True,
            "Risk Level": True,
            "Durasi Kontrak (hari)": True,
            "Label Vendor": False
        },
        color_discrete_map={"Tinggi": "red", "Sedang": "orange", "Rendah": "blue"},
        title="\ud83d\udccc Visualisasi Durasi Kontrak per Vendor berdasarkan Risk Level"
    )
    fig2.update_layout(
        yaxis_title="Vendor | Nomor Kontrak | Jenis Pengadaan",
        height=900,
        width=1100,
        legend_title="Risk Level"
    )
    st.plotly_chart(fig2, use_container_width=True)

    # \ud83d\udcc5 Unduh Grafik sebagai PNG (opsional jika Kaleido tersedia)
    try:
        img_bytes = to_image(fig2, format="png")
        st.download_button(
            label="\ud83d\udcc5 Unduh Grafik sebagai PNG",
            data=img_bytes,
            file_name="visualisasi_kontrak.png",
            mime="image/png"
        )
    except Exception as e:
        st.warning(f"\u26a0\ufe0f Gagal mengunduh gambar: {e}. Coba install kaleido dengan: pip install -U kaleido")

    # \ud83d\udcc5 Unduh hasil CSV
    csv = df.to_csv(index=False).encode('utf-8')
    st.download_button("\ud83d\udcc5 Unduh hasil sebagai CSV", data=csv, file_name="hasil_prediksi.csv", mime='text/csv')

else:
    st.info("\ud83d\udcc2 Silakan upload file CSV terlebih dahulu untuk mulai analisis.")
