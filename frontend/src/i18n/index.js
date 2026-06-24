import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  sw: {
    translation: {
        // Add these to your translation object
"Features": "Makala",
"About": "Kuhusu Sisi",
"Testimonials": "Maoni",
"Sign In": "Ingia",
"Get Started": "Anza",
"Dashboard": "Dashibodi",
"Digitalisation Partner": "Mshirika wa Digitali",
"for Microfinance": "kwa Mikopo Ndogo",
"Improve efficiency, reduce costs and launch new products & services with our cloud banking platform used by financial organisations all around the world.": "Boresha ufanisi, punguza gharama na anzisha bidhaa na huduma mpya kwa jukwaa letu la wingu linalotumiwa na mashirika ya kifedha duniani kote.",
"Start Free Trial": "Anza Jaribio Bila Malipo",
"Learn More": "Jifunze Zaidi",
"Financial Institutions": "Taasisi za Fedha",
"End Clients": "Wateja",
"Countries": "Nchi",
"Uptime Guarantee": "Dhamana ya Upatikanaji",
"The MicroFinance Core Platform": "Jukwaa Kuu la MicroFinance",
"Begin your digitalisation journey with our award-winning solution.": "Anza safari yako ya kidijitali na suluhisho letu lililoshinda tuzo.",
"Cloud Based": "Msingi wa Wingu",
"All you need is a reliable internet connection and a modern web browser. We guarantee an up-time of over 99.97%.": "Unachohitaji ni muunganisho wa mtandao wa kuaminika na kivinjari cha kisasa. Tunathibitisha upatikanaji wa zaidi ya 99.97%.",
"Per Client Pricing": "Bei kwa Kila Mteja",
"Flexible and affordable pricing structure enabling MFIs to benefit regardless of their size.": "Muundo wa bei rahisi na wa bei nafuu unaowezesha MFIs kufaidika bila kujali ukubwa wao.",
"Award Winning": "Mshindi wa Tuzo",
"Winner of multiple awards for technology, financial inclusion and innovation in microfinance.": "Mshindi wa tuzo nyingi za teknolojia, ujumuishaji wa kifedha na uvumbuzi katika mikopo ndogo.",
"Digital Field Application": "Programu ya Shambani",
"Improve loan officer efficiency, extend outreach and increase revenue with our revolutionary DFA.": "Boresha ufanisi wa afisa mkopo, panua ufikiaji na ongeza mapato kwa DFA yetu ya kimapinduzi.",
"Mobile Money Integration": "Uunganisho wa Pesa za Mkononi",
"Integrated with MMT services, enabling clients to repay loans and deposit savings over their mobile phones.": "Imeunganishwa na huduma za MMT, kuwezesha wateja kulipa mikopo na kuweka akiba kupitia simu zao za mkononi.",
"SMS Module": "Moduli ya SMS",
"Stay connected with your customers with our personalised and automated SMS module.": "Kaa karibu na wateja wako kwa moduli yetu ya SMS ya kibinafsi na ya kiotomatiki.",
"Empowering financial inclusion through technology.": "Kuimarisha ujumuishaji wa kifedha kupitia teknolojia.",
"Product": "Bidhaa",
"Pricing": "Bei",
"Company": "Kampuni",
"About Us": "Kuhusu Sisi",
"Careers": "Kazi",
"Contact": "Wasiliana Nasi",
"Support": "Msaada",
"Help Center": "Kituo cha Msaada",
"Documentation": "Nyaraka",
"API Status": "Hali ya API",
"All rights reserved.": "Haki zote zimehifadhiwa.",
      // Navigation
      "Dashboard": "Dashibodi",
      "Customers": "Wateja",
      "Loans": "Mikopo",
      "Payments": "Malipo",
      "Collections": "Makusanyo",
      "Reports": "Ripoti",
      "Settings": "Mipangilio",
      
      // Actions
      "Login": "Ingia",
      "Logout": "Toka",
      "Register": "Jisajili",
      "Create": "Unda",
      "Save": "Hifadhi",
      "Delete": "Futa",
      "Edit": "Hariri",
      "View": "Tazama",
      "Search": "Tafuta",
      "Filter": "Chuja",
      "Cancel": "Ghairi",
      "Confirm": "Thibitisha",
      
      // Customer
      "Customer": "Mteja",
      "Customers": "Wateja",
      "First Name": "Jina la Kwanza",
      "Last Name": "Jina la Mwisho",
      "Phone": "Simu",
      "Email": "Barua pepe",
      "Region": "Mkoa",
      "District": "Wilaya",
      "Occupation": "Kazi",
      "Monthly Income": "Mapato ya Mwezi",
      "Register Customer": "Sajili Mteja",
      "Edit Customer": "Hariri Mteja",
      
      // Loan
      "Loan": "Mkopo",
      "Loans": "Mikopo",
      "Loan Product": "Bidhaa ya Mkopo",
      "Principal": "Kiasi cha Mkopo",
      "Interest Rate": "Kiwango cha Riba",
      "Term": "Muda",
      "Repayment": "Malipo",
      "Penalty": "Adhabu",
      "Status": "Hali",
      "Apply Loan": "Omba Mkopo",
      "Approve": "Kubali",
      "Disburse": "Toa",
      "Pending": "Inasubiri",
      "Approved": "Imekubaliwa",
      "Disbursed": "Imetolewa",
      "Active": "Inaendelea",
      "Paid": "Imelipwa",
      "Defaulted": "Imeshindwa",
      
      // Payment
      "Payment": "Malipo",
      "Payments": "Malipo",
      "Amount": "Kiasi",
      "Payment Method": "Njia ya Malipo",
      "Cash": "Pesa Taslimu",
      "M-Pesa": "M-Pesa",
      "Airtel Money": "Airtel Money",
      "Bank": "Benki",
      "Record Payment": "Rekodi Malipo",
      
      // Collections
      "Collection": "Mkusanyo",
      "Collections": "Makusanyo",
      "Due Today": "Inadaiwa Leo",
      "Due Tomorrow": "Inadaiwa Kesho",
      "Overdue": "Imechelewa",
      "Defaulters": "Washindwa",
      
      // Reports
      "Report": "Ripoti",
      "Reports": "Ripoti",
      "Daily Report": "Ripoti ya Kila Siku",
      "Weekly Report": "Ripoti ya Kila Wiki",
      "Monthly Report": "Ripoti ya Kila Mwezi",
      
      // General
      "Welcome": "Karibu",
      "Total": "Jumla",
      "Balance": "Salio",
      "Today": "Leo",
      "Tomorrow": "Kesho",
      "This Month": "Mwezi Huu",
      "This Year": "Mwaka Huu",
      "Success": "Imefanikiwa",
      "Failed": "Imeshindwa",
      "Loading...": "Inapakia...",
      "No data": "Hakuna data",
      "Please wait": "Tafadhali subiri",
      "Are you sure?": "Una uhakika?",
      "Yes": "Ndio",
      "No": "Hapana",
      
      // Notifications
      "Payment Reminder": "Kikumbusho cha Malipo",
      "Payment Received": "Malipo Yamepokelewa",
      "Loan Approved": "Mkopo Umekubaliwa",
      "Loan Disbursed": "Mkopo Umetolewa",
      "Loan Overdue": "Mkopo Umechelewa",
      "System Notification": "Arifa ya Mfumo",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "sw",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;