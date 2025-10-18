# FoundersNet - Hackathon Submission

## 📋 Submission Checklist

### Project Information
- **Name:** FoundersNet
- **Category:** DeFi / Prediction Markets
- **Blockchain:** Algorand
- **Status:** Complete ✅

### Required Deliverables
- ✅ Smart Contract deployed on Algorand
- ✅ Working demo application
- ✅ Source code on GitHub
- ✅ README with setup instructions
- ✅ Documentation of features
- 🔲 Demo video (in progress)
- 🔲 Presentation slides (in progress)

---

## 🎥 Demo Video

**Link:** [Coming Soon]

**Includes:**
- Project overview and value proposition
- Live demo of placing bets and claiming winnings
- Code walkthrough (smart contract + frontend)
- Explanation of Algorand integration

**Duration:** ~5 minutes

---

## 🎨 Presentation

**Slides:** [Coming Soon - Canva]

**Covers:**
- Problem: 90% startup failure rate
- Solution: Prediction markets for risk management
- Use cases for founders, investors, and VCs
- Technical architecture
- Algorand advantages (speed, cost, BoxStorage)
- Demo walkthrough
- Business model and roadmap

---

## 🚀 Live Demo

**LocalNet:** http://localhost:5173 (requires AlgoKit LocalNet running)

**Smart Contract:**
- **App ID:** 1014 (LocalNet)
- **Language:** Python (Algorand Python)
- **Storage:** BoxStorage for events and bets
- **Encoding:** ARC-4 ABI

**Features Demonstrated:**
1. Connect Pera Wallet (or LocalNet accounts)
2. Browse prediction markets
3. Place YES/NO bets with ALGO
4. Admin creates new events
5. Admin resolves outcomes
6. Winners claim proportional payouts

---

## 💡 Innovation Highlights

### 1. Real-World Use Case
Addresses actual pain point: founders need financial protection against startup failure.

### 2. Democratization of Private Markets
First time retail investors can participate in startup outcomes without accreditation.

### 3. Signal Value for VCs
Prediction markets generate valuable data for investment decisions.

### 4. Technical Excellence
- Proper ARC-4 encoding/decoding
- BoxStorage for efficient data management
- Atomic transactions for bet placement
- Clean React architecture with TypeScript

### 5. Algorand Advantages
- **Fast:** 4-second finality
- **Cheap:** ~0.001 ALGO per transaction
- **Secure:** Battle-tested consensus
- **Developer-Friendly:** Python smart contracts

---

## 📊 Key Metrics

**Development Time:** ~2 weeks  
**Lines of Code:** ~5,000  
**Smart Contract Functions:** 4 (create, bet, resolve, claim)  
**Test Coverage:** Core functions tested  
**Documentation:** Comprehensive (ACTIVITY.md)  

---

## 🏗️ Technical Architecture

```
User Interface (React + TypeScript)
         ↓
Pera Wallet (Transaction Signing)
         ↓
Algorand Node (Smart Contract)
         ↓
BoxStorage (Event & Bet Data)
```

**Backend API:**
- Express.js REST endpoints
- ARC-4 decoding for event data
- PostgreSQL for caching/analytics

---

## 🎯 Future Roadmap

**Phase 1 (Current):** Core prediction market functionality  
**Phase 2:** Mobile app with native wallet integration  
**Phase 3:** Oracle integration for automated resolution  
**Phase 4:** Social features and founder profiles  
**Phase 5:** Multi-chain expansion (maintain Algorand as primary)  

---

## 🤝 Team

**Solo Developer:** Daniel  
**Role:** Full-stack development + smart contract implementation  
**Experience:** Web3 development, React, TypeScript, Algorand  

---

## 📞 Contact

**GitHub:** [Your GitHub]  
**Email:** [Your Email]  
**Twitter:** [Your Twitter]  

---

## 🙏 Acknowledgments

- Algorand Foundation for the blockchain infrastructure
- AlgoKit team for excellent developer tools
- Pera Wallet for seamless wallet integration
- Open source community for libraries and tools

---

**Built with ❤️ for the Algorand ecosystem**
