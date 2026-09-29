# DELIVERABLE 6 — SLIDE 6: RESEARCH AND REFERENCES

---

## Primary Data Sources

1. **Baltic Exchange.** (2024). *Baltic Dry Index Methodology and Route Definitions*. London: Baltic Exchange.  
   URL: [baltic-exchange.com](https://www.balticexchange.com/)  
   *[Primary data source for BDI, BCI C18 (Gladstone→Dhamra 150,000 MT coal benchmark), BPI, BSI, BHSI time series used in forecasting models]*

2. **Paradip Port Authority.** *Daily Traffic Bulletins — Vessel Arrival/Departure and Berth Occupancy Reports*.  
   URL: [paradipport.gov.in](https://www.paradipport.gov.in/)  
   *[Primary data source for port congestion, vessel scheduling, and berth utilisation at Paradip]*

3. **Visakhapatnam Port Authority.** *Port Statistics, Vessel Reports, and Infrastructure Specifications*.  
   URL: [vizagport.com](https://www.vizagport.com/)  
   *[Draft, LOA, beam, and handling rate specifications for Vizag Inner and Outer Harbors]*

4. **Dhamra Port Company Limited.** *Port Infrastructure Specifications — Draft, LOA, and Berth Capacity*.  
   URL: [dhamraport.com](https://www.dhamraport.com/)  
   *[Deep-water port specifications — 18.0m draft capability for Capesize and mini-VLOC]*

5. **Kolkata Port Trust / Syama Prasad Mookerjee Port.** *Hooghly River Tide Tables and Hydrographic Data — Annual Publication*.  
   URL: [kolkataporttrust.gov.in](https://www.kolkataporttrust.gov.in/)  
   *[Tidal prediction data for Haldia/Sagar-Sandheads — used in the Tidal Draft Predictor module]*

6. **Steel Authority of India Limited (SAIL).** *Annual Report 2023–24: Raw Material Procurement Section*.  
   URL: [sail.co.in](https://www.sail.co.in/)  
   *[SAIL coking coal import tonnage (~7.5 million MT/year), sourcing country breakdown, and landed cost data]*

7. **Directorate General of Commercial Intelligence and Statistics (DGCIS).** *Foreign Trade Statistics of India — Coking Coal Imports by Port, by Country of Origin*. Ministry of Commerce, Government of India.  
   *[Coking coal import volumes and unit values ($/MT) by Indian port — used for model calibration and landed cost validation]*

8. **Ministry of Railways.** *Freight Operations Information System (FOIS) — Rake Availability and Freight Rate Data*.  
   URL: [fois.indianrail.gov.in](https://fois.indianrail.gov.in/)  
   *[Railway freight rates per tonne-km for inland coal evacuation from Dhamra/Vizag to Durgapur/Bokaro — input to the Arbitrage Engine]*

9. **Transchart.** *Chartering Procedures for Central Government Public Sector Undertakings*. Ministry of Ports, Shipping and Waterways, Government of India.  
   URL: [shipmin.gov.in](https://www.shipmin.gov.in/)  
   *[Government chartering agency workflow — SAGAR DRISHTI is designed as a pre-Transchart decision-support tool]*

---

## Academic & Industry References

10. **Stopford, M.** (2009). *Maritime Economics* (3rd ed.). London: Routledge.  
    ISBN: 978-0-415-27558-3  
    *[Foundational reference for COA vs spot charter economics, voyage cost analysis, and dry bulk shipping market structure]*

11. **Markowitz, H.** (1952). Portfolio Selection. *Journal of Finance*, 7(1), 77–91.  
    DOI: 10.2307/2975974  
    *[Theoretical basis for the COA/Spot Portfolio Optimiser — applying mean-variance optimisation to chartering allocation]*

12. **Kavussanos, M.G., & Visvikis, I.D.** (2006). *Derivatives and Risk Management in Shipping*. London: Witherbys Publishing.  
    ISBN: 978-1-856-09262-5  
    *[Freight derivatives, COA pricing models, and risk management frameworks for maritime logistics]*

13. **Tsioumas, V., Papadimitriou, S., Smirlis, Y., & Zahran, S.Z.** (2017). A novel approach to forecasting the bulk freight market. *The Asian Journal of Shipping and Logistics*, 33(1), 33–41.  
    DOI: 10.1016/j.ajsl.2017.03.005  
    *[AIS-based dry bulk freight forecasting methodology — directly citable for SAGAR DRISHTI's forecasting approach]*

14. **Duru, O.** (2010). A fuzzy integrated logical forecasting model for dry bulk shipping index forecasting. *Expert Systems with Applications*, 37(7), 5372–5380.  
    DOI: 10.1016/j.eswa.2010.01.019  
    *[BDI forecasting model reference using fuzzy logic and integrated approach]*

15. **Drewry Shipping Consultants.** *Dry Bulk Freight Rate Outlook — Quarterly Review*.  
    URL: [drewry.co.uk](https://www.drewry.co.uk/)  
    *[COA discount benchmarks: 3-month 3–7%, 6-month 7–12%, 12-month 10–15% below spot]*

16. **Ship & Bunker.** *IFO380/VLSFO Bunker Fuel Price Historical Data — Daily Global Indices*.  
    URL: [shipandbunker.com](https://www.shipandbunker.com/)  
    *[Bunker fuel price data used as exogenous regressor in freight rate forecasting models]*

17. **India Meteorological Department (IMD).** *Bay of Bengal Cyclone Season Historical Data, Cyclone Tracks, and Intensity Classifications*.  
    URL: [imd.gov.in](https://www.imd.gov.in/)  
    *[Cyclone disruption data used as seasonal dummy variable in SARIMAX model and as input to Risk Early-Warning Module]*

18. **HuggingFace.** *DistilBERT and Zero-Shot Classification Models (facebook/bart-large-mnli)*.  
    URL: [huggingface.co](https://huggingface.co/)  
    *[NLP engine technical reference for the Geopolitical Disruption Sentiment Engine]*

19. **Taylor, S.J., & Letham, B.** (2018). Forecasting at Scale. *The American Statistician*, 72(1), 37–45. Facebook Research.  
    DOI: 10.1080/00031305.2017.1380080  
    *[Prophet forecasting model — used for trend decomposition and seasonality detection in freight rate time series]*

20. **Veson Nautical.** *IMOS Platform — Voyage Management and COA Scheduling*.  
    URL: [veson.com](https://www.veson.com/)  
    *[Industry benchmark commercial platform — referenced for competitive positioning. SAGAR DRISHTI differentiates with India-specific East Coast digital twin, COA portfolio optimiser, and Transchart integration]*

---

## Additional Technical References

21. **Chen, T., & Guestrin, C.** (2016). XGBoost: A Scalable Tree Boosting System. *Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining*, 785–794.  
    DOI: 10.1145/2939672.2939785  
    *[XGBoost algorithm reference — used in the ensemble forecasting layer]*

22. **Lewis, P., Perez, E., Piktus, A., et al.** (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. *Advances in Neural Information Processing Systems*, 33, 9459–9474.  
    *[RAG architecture reference — used in the SAGAR DRISHTI Charter-Copilot to prevent LLM hallucination]*

23. **National Steel Policy 2017.** Ministry of Steel, Government of India.  
    *[Policy context: India targets 300 MT steel capacity by 2030 — drives proportionally higher coking coal imports]*

24. **Clarksons Research.** *Shipping Review and Outlook — Annual*.  
    URL: [clarksons.com](https://www.clarksons.com/)  
    *[Industry benchmark for COA discount structures and dry bulk market analysis]*

25. **Gangavaram Port Limited.** *Port Infrastructure and Vessel Handling Specifications*.  
    URL: [gangavaram.com](https://www.gangavaram.com/)  
    *[Deep-draft port specifications — 16.0m draft capability]*

---
