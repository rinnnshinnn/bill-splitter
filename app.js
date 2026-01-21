import { supabase } from "./supabase.js";

const billTypes = ["rent", "electric", "water", "internet"];
const personIds = { 1: "Gab", 2: "Francine" };

async function fetchBills() {
  const { data: bills, error } = await supabase.from("bills").select("*");
  if (error) return console.error(error);
  return bills;
}

// Add a bill
window.addBill = async function() {
  const type = document.getElementById("type").value.toLowerCase();
  const amount = Number(document.getElementById("amount").value);
  const paid_by = Number(document.getElementById("paidBy").value);
  const month = document.getElementById("month").value;

  if (!billTypes.includes(type)) return alert("Bill type must be rent, electric, water, or internet!");
  if (!amount || !month) return alert("Fill all fields!");

  const { error } = await supabase.from("bills").insert([{ type, amount, paid_by, month }]);
  if (error) return console.error(error);

  document.getElementById("type").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("month").value = "";

  calculate(); // recalc table
};

// Calculate per person
async function calculate() {
  const bills = await fetchBills();
  if (!bills) return;

  // Initialize table
  const tableData = {
    1: { rent: 0, electric: 0, water: 0, internet: 0, total: 0 },
    2: { rent: 0, electric: 0, water: 0, internet: 0, total: 0 },
  };

  // Step 1: Split bills evenly, subtract who paid
  bills.forEach(b => {
    const share = b.amount / 2;
    // Paid by someone? subtract their share
    billTypes.forEach(bt => {
      if (bt === b.type) {
        if (b.paid_by === 1) {
          tableData[1][bt] += 0; // Gab paid, no owed
          tableData[2][bt] += share; // Francine owes her half
        } else {
          tableData[1][bt] += share; // Gab owes her half
          tableData[2][bt] += 0; // Francine paid, no owed
        }
      }
    });
  });

  // Step 2: Reallocate debts to largest other bill
  Object.keys(tableData).forEach(pid => {
    let person = tableData[pid];
    let debt = 0;
    billTypes.forEach(bt => {
      if (person[bt] < 0) debt += -person[bt]; // overpaid
      if (person[bt] < 0) person[bt] = 0;
    });
    if (debt > 0) {
      // Allocate to largest unpaid bill
      let maxBill = billTypes.reduce((a, b) => (person[a] > person[b] ? a : b));
      person[maxBill] += debt;
    }
    person.total = billTypes.reduce((sum, bt) => sum + person[bt], 0);
  });

  // Step 3: Update HTML table
  document.getElementById("gabRow").innerHTML = `
    <td>Gab</td>
    <td>${tableData[1].rent.toFixed(2)}</td>
    <td>${tableData[1].electric.toFixed(2)}</td>
    <td>${tableData[1].water.toFixed(2)}</td>
    <td>${tableData[1].internet.toFixed(2)}</td>
    <td>${tableData[1].total.toFixed(2)}</td>
  `;

  document.getElementById("francineRow").innerHTML = `
    <td>Francine</td>
    <td>${tableData[2].rent.toFixed(2)}</td>
    <td>${tableData[2].electric.toFixed(2)}</td>
    <td>${tableData[2].water.toFixed(2)}</td>
    <td>${tableData[2].internet.toFixed(2)}</td>
    <td>${tableData[2].total.toFixed(2)}</td>
  `;
}

// Initial calculation on load
calculate();
