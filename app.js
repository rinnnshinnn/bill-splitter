import { supabase } from "./supabase.js";

// Add a new bill
window.addBill = async function() {
  const type = document.getElementById("type").value;
  const amount = Number(document.getElementById("amount").value);
  const paidBy = Number(document.getElementById("paidBy").value);
  const month = document.getElementById("month").value;

  if (!type || !amount || !paidBy || !month) {
    alert("Please fill all fields!");
    return;
  }

  const { error } = await supabase
    .from("bills")
    .insert([{ type, amount, paid_by: paidBy, month }]);

  if (error) {
    alert(error.message);
  } else {
    alert("Bill added successfully!");
    calculate();
    document.getElementById("type").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("month").value = "";
  }
};

// Calculate totals and balances
async function calculate() {
  const { data: bills, error } = await supabase.from("bills").select("*");
  if (error) { console.error(error); return; }

  let total = 0;
  let paid = { 1: 0, 2: 0 };

  bills.forEach(b => {
    total += Number(b.amount);
    paid[b.paid_by] += Number(b.amount);
  });

  const fairShare = total / 2;

  document.getElementById("summary").innerHTML = `
    <p>Total bills: ₱${total}</p>
    <p>Each should pay: ₱${fairShare}</p>
    <p>Gab balance: ₱${(fairShare - paid[1]).toFixed(2)}</p>
    <p>Sibling balance: ₱${(fairShare - paid[2]).toFixed(2)}</p>
  `;
}

// Run calculation on page load
calculate();
