// Custom form options handler
document.addEventListener('DOMContentLoaded', () => {
    const travelDaysSelect = document.getElementById('travel-days');
    const budgetSelect = document.getElementById('budget');

    // Add custom options if they don't exist
    if (travelDaysSelect && !document.querySelector('option[value="custom"]')) {
        const customDaysOption = document.createElement('option');
        customDaysOption.value = 'custom';
        customDaysOption.textContent = 'Custom (specify below)';
        travelDaysSelect.appendChild(customDaysOption);

        // Create custom days input
        const customDaysInput = document.createElement('input');
        customDaysInput.type = 'number';
        customDaysInput.id = 'custom-days';
        customDaysInput.className = 'form-input';
        customDaysInput.placeholder = 'Enter number of days (1-30)';
        customDaysInput.min = '1';
        customDaysInput.max = '30';
        customDaysInput.style.display = 'none';
        customDaysInput.style.marginTop = '10px';

        travelDaysSelect.parentElement.appendChild(customDaysInput);

        // Show/hide custom input
        travelDaysSelect.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                customDaysInput.style.display = 'block';
                customDaysInput.required = true;
                travelDaysSelect.removeAttribute('required');
            } else {
                customDaysInput.style.display = 'none';
                customDaysInput.required = false;
                travelDaysSelect.setAttribute('required', 'required');
            }
        });
    }

    // Add custom budget option if it doesn't exist
    if (budgetSelect && !document.querySelector('option[value="custom-budget"]')) {
        const customBudgetOption = document.createElement('option');
        customBudgetOption.value = 'custom-budget';
        customBudgetOption.textContent = 'Custom Budget';
        budgetSelect.appendChild(customBudgetOption);

        // Create custom budget input
        const customBudgetInput = document.createElement('input');
        customBudgetInput.type = 'number';
        customBudgetInput.id = 'custom-budget';
        customBudgetInput.className = 'form-input';
        customBudgetInput.placeholder = 'Enter daily budget in USD';
        customBudgetInput.min = '10';
        customBudgetInput.max = '10000';
        customBudgetInput.style.display = 'none';
        customBudgetInput.style.marginTop = '10px';

        budgetSelect.parentElement.appendChild(customBudgetInput);

        // Show/hide custom input
        budgetSelect.addEventListener('change', (e) => {
            if (e.target.value === 'custom-budget') {
                customBudgetInput.style.display = 'block';
                customBudgetInput.required = true;
                budgetSelect.removeAttribute('required');
            } else {
                customBudgetInput.style.display = 'none';
                customBudgetInput.required = false;
                budgetSelect.setAttribute('required', 'required');
            }
        });
    }

    // Intercept form submission
    const tripForm = document.getElementById('trip-form');
    if (tripForm) {
        tripForm.addEventListener('submit', function (e) {
            const travelDaysSelect = document.getElementById('travel-days');
            const customDaysInput = document.getElementById('custom-days');
            const budgetSelect = document.getElementById('budget');
            const customBudgetInput = document.getElementById('custom-budget');

            // Handle custom days
            if (travelDaysSelect && travelDaysSelect.value === 'custom') {
                if (customDaysInput && customDaysInput.value) {
                    // Create a temporary option with the custom value
                    const tempOption = document.createElement('option');
                    tempOption.value = customDaysInput.value;
                    tempOption.selected = true;
                    travelDaysSelect.appendChild(tempOption);
                } else {
                    e.preventDefault();
                    alert('Please enter the number of days');
                    return false;
                }
            }

            // Handle custom budget
            if (budgetSelect && budgetSelect.value === 'custom-budget') {
                if (customBudgetInput && customBudgetInput.value) {
                    // Create a temporary option with the custom value
                    const tempOption = document.createElement('option');
                    tempOption.value = `Custom ($${customBudgetInput.value}/day)`;
                    tempOption.selected = true;
                    budgetSelect.appendChild(tempOption);
                } else {
                    e.preventDefault();
                    alert('Please enter your daily budget');
                    return false;
                }
            }
        }, true); // Use capture phase to run before other handlers
    }
});
