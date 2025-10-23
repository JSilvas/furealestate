(function() {
    'use strict';

    // --- CHART INSTANCES ---
    let wealthChartInstance;
    let buyingPowerChartInstance;
    let monthlyCostChartInstance;
    let monthlyRentChartInstance;
    let leverageChartInstance;

    // --- FORMATTER ---
    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });

    // --- DOM Elements ---
    const elements = {
        home_price: document.getElementById('home_price'),
        household_income: document.getElementById('household_income'),
        initial_monthly_rent: document.getElementById('initial_monthly_rent'),
        rental_income_monthly: document.getElementById('rental_income_monthly'),
        utilities_offset: document.getElementById('utilities_offset'),
        reserve_cash: document.getElementById('reserve_cash'),
        monthlyExpenseOutput: document.getElementById('monthly-expense-output'),
        leverageAnalysisOutput: document.getElementById('leverage-analysis-output'),
        resultsOutput: document.getElementById('results-output'),
        wealthChartCanvas: document.getElementById('wealthChart').getContext('2d'),
        buyingPowerChartCanvas: document.getElementById('buyingPowerChart').getContext('2d'),
        rentalInputsContainer: document.getElementById('rental-inputs-container'),
        geminiButton: document.getElementById('gemini-analysis-button'),
        geminiOutput: document.getElementById('gemini-output'),
        // Reserve breakdown card elements
        reserve_breakdown_card: document.getElementById('reserve_breakdown_card'),
        reserve_total_display: document.getElementById('reserve_total_display'),
        reserve_minus_downpayment: document.getElementById('reserve_minus_downpayment'),
        reserve_minus_renovations: document.getElementById('reserve_minus_renovations'),
        reserve_available_display: document.getElementById('reserve_available_display'),
        reserve_status_label: document.getElementById('reserve_status_label'),
        // calculated displays (may be undefined if element missing)
        down_payment_percent_calc: document.getElementById('down_payment_percent_calc'),
        interest_rate_percent_calc: document.getElementById('interest_rate_percent_calc'),
        property_tax_rate_percent_calc: document.getElementById('property_tax_rate_percent_calc'),
        home_insurance_rate_percent_calc: document.getElementById('home_insurance_rate_percent_calc'),
        maintenance_rate_percent_calc: document.getElementById('maintenance_rate_percent_calc'),
        closing_costs_percent_calc: document.getElementById('closing_costs_percent_calc'),
        home_appreciation_rate_percent_calc: document.getElementById('home_appreciation_rate_percent_calc'),
        annual_rent_increase_percent_calc: document.getElementById('annual_rent_increase_percent_calc'),
        tax_rate_percent_calc: document.getElementById('tax_rate_percent_calc'),
        pmi_rate_percent_calc: document.getElementById('pmi_rate_percent_calc'),
        renovation_percent_calc: document.getElementById('renovation_percent_calc'),
    };

    const inputGroups = {
        down_payment_percent: { slider: 'down_payment_percent_slider', number: 'down_payment_percent_number' },
        dti_percent: { slider: 'dti_percent_slider', number: 'dti_percent_number' },
        interest_rate_percent: { slider: 'interest_rate_percent_slider', number: 'interest_rate_percent_number' },
        closing_costs_percent: { slider: 'closing_costs_percent_slider', number: 'closing_costs_percent_number' },
        time_horizon: { slider: 'time_horizon_slider', number: 'time_horizon_number' },
        home_appreciation_rate_percent: { slider: 'home_appreciation_rate_percent_slider', number: 'home_appreciation_rate_percent_number' },
        property_tax_rate_percent: { slider: 'property_tax_rate_percent_slider', number: 'property_tax_rate_percent_number' },
        home_insurance_rate_percent: { slider: 'home_insurance_rate_percent_slider', number: 'home_insurance_rate_percent_number' },
        maintenance_rate_percent: { slider: 'maintenance_rate_percent_slider', number: 'maintenance_rate_percent_number' },
        annual_rent_increase_percent: { slider: 'annual_rent_increase_percent_slider', number: 'annual_rent_increase_percent_number' },
        inflation_rate_percent: { slider: 'inflation_rate_percent_slider', number: 'inflation_rate_percent_number' },
        market_investment_return_percent: { slider: 'market_investment_return_percent_slider', number: 'market_investment_return_percent_number' },
        tax_rate_percent: { slider: 'tax_rate_percent_slider', number: 'tax_rate_percent_number' },
        pmi_rate_percent: { slider: 'pmi_rate_percent_slider', number: 'pmi_rate_percent_number' },
        start_renting_year: { slider: 'start_renting_year_slider', number: 'start_renting_year_number' },
        rental_income_increase_percent: { slider: 'rental_income_increase_percent_slider', number: 'rental_income_increase_percent_number' },
        renovation_percent: { slider: 'renovation_percent_slider', number: 'renovation_percent_number' },
    };

    function getValues() {
        const values = {
            home_price: parseFloat(elements.home_price.value) || 0,
            household_income: parseFloat(elements.household_income.value) || 0,
            initial_monthly_rent: parseFloat(elements.initial_monthly_rent.value) || 0,
            rental_income_monthly: parseFloat(elements.rental_income_monthly.value) || 0,
            utilities_offset: parseFloat(elements.utilities_offset.value) || 0,
            reserve_cash: parseFloat(elements.reserve_cash.value) || 0
        };
        for (const key in inputGroups) {
            values[key] = parseFloat(document.getElementById(inputGroups[key].number).value) || 0;
        }
        return values;
    }

    // --- Core Financial Calculation Engine ---
    // This module is now a pure function, it does not interact with the DOM.
    function calculateSimulation(values) {
        const loan_years = 30;
        const time_horizon = values.time_horizon;

        const down_payment = values.home_price * (values.down_payment_percent / 100);
        const renovation_costs = values.home_price * (values.renovation_percent / 100);
        const loan_amount = values.home_price - down_payment;
        const interest_rate = values.interest_rate_percent / 100;
        const monthly_interest_rate = interest_rate / 12;
        const num_payments = loan_years * 12;

        let monthly_mortgage_payment = 0;
        if (monthly_interest_rate > 0 && loan_amount > 0) {
            monthly_mortgage_payment = loan_amount * (monthly_interest_rate * Math.pow(1 + monthly_interest_rate, num_payments)) / (Math.pow(1 + monthly_interest_rate, num_payments) - 1);
        } else if (loan_amount > 0) {
            monthly_mortgage_payment = loan_amount / num_payments;
        }

        const closing_costs = values.home_price * (values.closing_costs_percent / 100);
        const initial_monthly_tax = (values.home_price * (values.property_tax_rate_percent / 100)) / 12;
        const initial_monthly_insurance = (values.home_price * (values.home_insurance_rate_percent / 100)) / 12;
        const initial_monthly_maintenance = (values.home_price * (values.maintenance_rate_percent / 100)) / 12;

        let total_monthly_buyer_cost_year1 = monthly_mortgage_payment + initial_monthly_tax + initial_monthly_insurance + initial_monthly_maintenance + values.utilities_offset;

        const gross_monthly_income = values.household_income / 12;
        const housing_dti = gross_monthly_income > 0 ? (total_monthly_buyer_cost_year1 / gross_monthly_income) * 100 : 0;

        // Reserve cash calculations
        let available_reserve = values.reserve_cash - down_payment - renovation_costs;
        const target_monthly_expense = gross_monthly_income * (values.dti_percent / 100);

        // Calculate effective DTI with reserve contribution (for Year 1)
        let month1_reserve_contribution = 0;
        if (available_reserve > 0 && total_monthly_buyer_cost_year1 > target_monthly_expense) {
            month1_reserve_contribution = Math.min(
                total_monthly_buyer_cost_year1 - target_monthly_expense,
                available_reserve
            );
        }
        const effective_monthly_cost_year1 = total_monthly_buyer_cost_year1 - month1_reserve_contribution;
        const effective_dti = gross_monthly_income > 0 ? (effective_monthly_cost_year1 / gross_monthly_income) * 100 : 0;

        let current_home_value = values.home_price;
        let remaining_loan_balance = loan_amount;
        let current_monthly_rent = values.initial_monthly_rent;
        // Renter starts with reserve cash minus down payment and closing costs
        let renter_investment_portfolio = values.reserve_cash - down_payment - closing_costs;
        // Homeowner starts with investment portfolio at zero, but renovation costs reduce their liquid assets
        let homeowner_investment_portfolio = 0;
        let current_monthly_rental_income = values.rental_income_monthly;
        let average_annual_rental_cash_flow = 0;
        let rental_years = 0;
        let year1_principal_paid = 0;
        let cumulative_reserve_used = 0;
        let reserve_depletion_month = null;
        
        const results = [];
        for (let year = 1; year <= time_horizon; year++) {
            const home_appreciation_rate = values.home_appreciation_rate_percent / 100;
            const property_tax_rate = values.property_tax_rate_percent / 100;
            const home_insurance_rate = values.home_insurance_rate_percent / 100;
            const maintenance_rate = values.maintenance_rate_percent / 100;
            const market_investment_return = values.market_investment_return_percent / 100;
            const annual_rent_increase = values.annual_rent_increase_percent / 100;
            const tax_rate = values.tax_rate_percent / 100;
            const pmi_rate = values.pmi_rate_percent / 100;
            const inflation_rate = values.inflation_rate_percent / 100;
            const rental_income_increase = values.rental_income_increase_percent / 100;

            renter_investment_portfolio *= (1 + market_investment_return);
            homeowner_investment_portfolio *= (1 + market_investment_return);
            
            let annual_principal_paid = 0;
            let annual_interest_paid = 0;
            if (remaining_loan_balance > 0 && year <= loan_years) {
                 for (let month = 0; month < 12; month++) {
                    const interest_paid_month = remaining_loan_balance * monthly_interest_rate;
                    annual_interest_paid += interest_paid_month;
                    let principal_paid_month = monthly_mortgage_payment - interest_paid_month;
                    if (remaining_loan_balance - principal_paid_month < 0) {
                        principal_paid_month = remaining_loan_balance;
                    }
                    annual_principal_paid += principal_paid_month;
                    remaining_loan_balance -= principal_paid_month;
                }
            }
            if (year === 1) year1_principal_paid = annual_principal_paid;

            // Track reserve contributions month-by-month
            let annual_reserve_contribution = 0;
            const monthly_tax = (current_home_value * property_tax_rate) / 12;
            const monthly_insurance = (current_home_value * home_insurance_rate) / 12;
            const monthly_maintenance = (current_home_value * maintenance_rate) / 12;

            for (let month = 0; month < 12; month++) {
                const total_monthly_cost = monthly_mortgage_payment + monthly_tax + monthly_insurance + monthly_maintenance + values.utilities_offset;

                // Calculate reserve contribution needed to hit target DTI
                if (available_reserve > 0 && total_monthly_cost > target_monthly_expense) {
                    const needed_contribution = total_monthly_cost - target_monthly_expense;
                    const actual_contribution = Math.min(needed_contribution, available_reserve);

                    annual_reserve_contribution += actual_contribution;
                    available_reserve -= actual_contribution;
                    cumulative_reserve_used += actual_contribution;

                    // Track when reserves are depleted
                    if (available_reserve <= 0 && reserve_depletion_month === null) {
                        reserve_depletion_month = (year - 1) * 12 + month + 1;
                    }
                }
            }

            let annual_pmi_cost = 0;
            if (loan_amount > 0 && (down_payment/values.home_price) < 0.2 && remaining_loan_balance / current_home_value > 0.8) {
                annual_pmi_cost = loan_amount * pmi_rate;
            }

            /*
             * ARCHITECT'S NOTE: The mortgage interest deduction is a simplification.
             * In the US tax code, this is an itemized deduction. It only provides a financial benefit
             * if the taxpayer's total itemized deductions (mortgage interest, state and local taxes, etc.)
             * exceed the standard deduction. This model assumes the user always benefits from the
             * full deduction, which may overstate the tax savings.
             */
            const mortgage_interest_deduction_savings = annual_interest_paid * tax_rate;

            const gross_annual_buyer_cost = (year <= loan_years ? (monthly_mortgage_payment * 12) : 0) + 
                                           (current_home_value * property_tax_rate) + 
                                           (current_home_value * home_insurance_rate) + 
                                           (current_home_value * maintenance_rate) + 
                                           annual_pmi_cost +
                                           (values.utilities_offset * 12);

            const annual_buyer_cost_for_renter_comparison = gross_annual_buyer_cost - mortgage_interest_deduction_savings;

            if (values.start_renting_year > 0 && year >= values.start_renting_year) {
                const annual_rental_income = current_monthly_rental_income * 12;
                const net_cash_flow_from_rental = annual_rental_income - gross_annual_buyer_cost;
                
                if (net_cash_flow_from_rental > 0) {
                    homeowner_investment_portfolio += net_cash_flow_from_rental;
                    average_annual_rental_cash_flow += net_cash_flow_from_rental;
                    rental_years++;
                }
                current_monthly_rental_income *= (1 + rental_income_increase);
            }

            current_home_value *= (1 + home_appreciation_rate);
            const buyer_equity = current_home_value - remaining_loan_balance;
            const buyer_total_net_worth = buyer_equity + homeowner_investment_portfolio;
            
            const monthly_cost_difference = (annual_buyer_cost_for_renter_comparison / 12) - current_monthly_rent;
            if (monthly_cost_difference > 0) {
                renter_investment_portfolio += (monthly_cost_difference * 12);
            }
            current_monthly_rent *= (1 + annual_rent_increase);

            const buyer_net_worth_real = buyer_total_net_worth / Math.pow(1 + inflation_rate, year);
            const renter_net_worth_real = renter_investment_portfolio / Math.pow(1 + inflation_rate, year);

            results.push({
                Year: year, buyer_net_worth: buyer_total_net_worth, renter_net_worth: renter_investment_portfolio,
                home_value: current_home_value, remaining_loan: remaining_loan_balance,
                buyer_net_worth_real, renter_net_worth_real,
                available_reserve: available_reserve,
                annual_reserve_contribution: annual_reserve_contribution,
                cumulative_reserve_used: cumulative_reserve_used
            });
        }
         if (rental_years > 0) {
            average_annual_rental_cash_flow /= rental_years;
        }

        // Leverage calculations for Year 1
        const appreciation_gain_y1 = values.home_price * (values.home_appreciation_rate_percent / 100);
        const total_equity_gain_y1 = appreciation_gain_y1 + year1_principal_paid;
        const leveraged_roe = down_payment > 0 ? (total_equity_gain_y1 / down_payment) * 100 : 0;
        const real_leveraged_roe = leveraged_roe - values.inflation_rate_percent;

        return {
            simulationData: results,
            monthlyCosts: {
                mortgage: monthly_mortgage_payment, tax: initial_monthly_tax, insurance: initial_monthly_insurance, maintenance: initial_monthly_maintenance, utilities: values.utilities_offset,
                total_buyer: total_monthly_buyer_cost_year1, rent: values.initial_monthly_rent,
                effective_monthly_cost: effective_monthly_cost_year1,
                month1_reserve_contribution: month1_reserve_contribution
            },
            ratios: {
                housing_dti: housing_dti,
                effective_dti: effective_dti
            },
            reserveAnalysis: {
                starting_reserve: values.reserve_cash,
                down_payment: down_payment,
                renovation_costs: renovation_costs,
                initial_available_reserve: values.reserve_cash - down_payment - renovation_costs,
                final_available_reserve: available_reserve,
                cumulative_reserve_used: cumulative_reserve_used,
                reserve_depletion_month: reserve_depletion_month
            },
            rentalAnalysis: { average_annual_rental_cash_flow: average_annual_rental_cash_flow },
            leverageAnalysis: {
                appreciation_gain_y1, year1_principal_paid, total_equity_gain_y1, down_payment, leveraged_roe, real_leveraged_roe
            }
        };
    }

    // --- Chat State Management ---
    const chatState = {
        isOpen: false,
        compressedContext: null,
        recentMessages: [],
        messageCount: 0,
        lastSummarizedAt: 0,
        lastAnalyzedParams: null,
        systemPrompt: "You are a world-class financial and investment advisor, known for your calculating and insightful analysis. Your tone is professional, sophisticated, and direct. You deliver maximum insight in minimum words.\n\nCONTEXT: This analysis includes reserve cash management. The user has total reserve cash that covers down payment, optional renovations, and can be used monthly to reduce their effective DTI ratio. Reserves are automatically applied to achieve the target DTI until depleted.\n\nSTRICT FORMAT RULES:\n- Initial analysis: ONE paragraph (3-4 sentences max) + 3-5 bullet points\n- Each bullet point: Maximum 1-2 sentences, no sub-explanations\n- Follow-ups: 2-4 sentences unless question demands detail\n- NO academic language, NO lengthy explanations, NO filler\n- Use numbers and data, skip the theory\n- If reserve cash is being used, comment on the sustainability and DTI impact when reserves deplete",
        SUMMARIZE_THRESHOLD: 8,
        KEEP_RECENT_COUNT: 5
    };

    const chatElements = {
        panel: document.getElementById('chat-panel'),
        messages: document.getElementById('chat-messages'),
        input: document.getElementById('chat-input'),
        sendBtn: document.getElementById('chat-send-btn'),
        toggleBtn: document.getElementById('chat-toggle-btn'),
        minimizeBtn: document.getElementById('chat-minimize-btn'),
        closeBtn: document.getElementById('chat-close-btn'),
        paramsChangedBadge: document.getElementById('params-changed-badge'),
        refreshAnalysisBtn: document.getElementById('refresh-analysis-btn')
    };

    // --- Chat UI Functions ---
    function openChatPanel() {
        chatState.isOpen = true;
        chatElements.panel.classList.add('open');
        chatElements.toggleBtn.style.display = 'none';
        elements.geminiButton.style.display = 'none';
        elements.geminiOutput.style.display = 'none';
    }

    function closeChatPanel() {
        chatState.isOpen = false;
        chatElements.panel.classList.remove('open');
        chatElements.toggleBtn.style.display = 'flex';
    }

    function minimizeChatPanel() {
        chatElements.panel.classList.remove('open');
        chatElements.toggleBtn.style.display = 'flex';
    }

    function formatChatContent(content) {
        // Split into sections by double newlines (paragraphs)
        const sections = content.split('\n\n').filter(s => s.trim());

        return sections.map(section => {
            const lines = section.split('\n').filter(l => l.trim());

            // Check if this section is a bullet list (starts with *, •, or -)
            if (lines[0] && lines[0].match(/^[\*\•\-]\s/)) {
                const items = lines.map(line => {
                    // Remove bullet character and format
                    const text = line.replace(/^[\*\•\-]\s+/, '');
                    const formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    return `<li>${formatted}</li>`;
                }).join('');
                return `<ul class="chat-bullet-list">${items}</ul>`;
            } else {
                // Regular paragraph
                const formatted = section
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br>');
                return `<p class="chat-paragraph">${formatted}</p>`;
            }
        }).join('');
    }

    function appendChatMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role}`;

        const label = document.createElement('div');
        label.className = 'chat-message-label';
        label.textContent = role === 'user' ? 'You' : 'Financial Advisor';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'chat-message-content';

        // Format content with proper paragraph and bullet list styling
        const formattedContent = formatChatContent(content);
        contentDiv.innerHTML = formattedContent;

        messageDiv.appendChild(label);
        messageDiv.appendChild(contentDiv);
        chatElements.messages.appendChild(messageDiv);

        // Scroll to bottom
        chatElements.messages.scrollTop = chatElements.messages.scrollHeight;
    }

    function showChatLoading() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'chat-message model';
        loadingDiv.innerHTML = `
            <div class="chat-message-label">Financial Advisor</div>
            <div class="chat-loading">
                <div class="spinner"></div>
                <span>Analyzing...</span>
            </div>
        `;
        loadingDiv.id = 'chat-loading-indicator';
        chatElements.messages.appendChild(loadingDiv);
        chatElements.messages.scrollTop = chatElements.messages.scrollHeight;
    }

    function removeChatLoading() {
        const loadingDiv = document.getElementById('chat-loading-indicator');
        if (loadingDiv) loadingDiv.remove();
    }

    // --- Parameter Change Detection ---
    function captureCurrentParams() {
        return JSON.parse(JSON.stringify(getValues()));
    }

    function hasParamsChanged() {
        if (!chatState.lastAnalyzedParams) return false;
        const current = getValues();
        return JSON.stringify(current) !== JSON.stringify(chatState.lastAnalyzedParams);
    }

    function updateParamsChangeIndicator() {
        const changed = hasParamsChanged();
        chatElements.paramsChangedBadge.style.display = changed ? 'inline-block' : 'none';
        chatElements.refreshAnalysisBtn.style.display = changed ? 'flex' : 'none';
    }

    // --- Context Compression ---
    async function summarizeConversation() {
        const messagesToSummarize = chatState.recentMessages.slice(0, -chatState.KEEP_RECENT_COUNT);
        if (messagesToSummarize.length === 0) return;

        try {
            const response = await fetch('/api/gemini-summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: messagesToSummarize })
            });

            if (!response.ok) {
                console.error('Failed to summarize conversation');
                return;
            }

            const { summary } = await response.json();

            // Update state
            chatState.compressedContext = summary;
            chatState.recentMessages = chatState.recentMessages.slice(-chatState.KEEP_RECENT_COUNT);
            chatState.lastSummarizedAt = chatState.messageCount;

            console.log('Conversation summarized. Compressed context:', summary);
        } catch (error) {
            console.error('Error summarizing conversation:', error);
        }
    }

    // --- Generate Financial Report Query ---
    function generateFinancialReportQuery() {
        const values = getValues();
        const { simulationData, ratios, rentalAnalysis, monthlyCosts, leverageAnalysis } = calculateSimulation(values);
        const finalYearData = simulationData.length > 0 ? simulationData[simulationData.length - 1] : null;

        let query = `Analyze the following buy-vs-rent financial scenario and provide a multi-paragraph advisory report. Focus on the key drivers, potential risks, and strategic opportunities.

        --- Key Scenario Inputs ---
        Home Price: ${formatter.format(values.home_price)}
        Annual Household Income: ${formatter.format(values.household_income)}
        Down Payment: ${values.down_payment_percent}%
        Interest Rate: ${values.interest_rate_percent}%
        Time Horizon: ${values.time_horizon} years
        Home Appreciation Rate: ${values.home_appreciation_rate_percent}%/year
        Market Investment Return for Renter: ${values.market_investment_return_percent}%/year
        General Inflation: ${values.inflation_rate_percent}%/year

        --- First-Year Leverage Analysis ---
        Leveraged Return on Equity (Nominal): ${leverageAnalysis.leveraged_roe.toFixed(2)}%
        Leveraged Return on Equity (Real, Inflation-Adjusted): ${leverageAnalysis.real_leveraged_roe.toFixed(2)}%

        --- Calculated Ratios & First Year Costs ---
        First Year Total Monthly Cost to Buy: ${formatter.format(monthlyCosts.total_buyer)}
        Calculated Housing DTI (Front-End): ${ratios.housing_dti.toFixed(2)}%
        Target Total DTI: ${values.dti_percent}%`;

        if(finalYearData) {
            query += `

--- Final Projected Outcome at Year ${values.time_horizon} ---
        Projected Homeowner Net Worth: ${formatter.format(finalYearData.buyer_net_worth)} (Nominal) / ${formatter.format(finalYearData.buyer_net_worth_real)} (Real, Today's Dollars)
        Projected Renter Investments: ${formatter.format(finalYearData.renter_net_worth)} (Nominal) / ${formatter.format(finalYearData.renter_net_worth_real)} (Real, Today's Dollars)`;
        }

        if (values.start_renting_year > 0) {
            query += `

--- Special Condition: Rental Conversion ---
        The homeowner plans to convert the property to a rental starting in year ${values.start_renting_year}.
        This generates an initial monthly income of ${formatter.format(values.rental_income_monthly)}.
        The calculated average annual net cash flow from this rental is approximately ${formatter.format(rentalAnalysis.average_annual_rental_cash_flow)}.`;
        }

        query += "\n\n**RESPONSE FORMAT (STRICT):**\n1. ONE paragraph only: 3-4 sentences maximum. Cut to the chase.\n2. Then 4-6 bullet points (1-2 sentences each):\n   • Key financial driver (the ONE thing that matters most)\n   • Secondary factors (positive/negative)\n   • Primary risk\n   • Bottom-line recommendation\n\n**STYLE RULES:**\n- Use specific numbers from the data above\n- NO lengthy explanations or academic language\n- NO phrases like \"this scenario presents\" or \"it's important to note\"\n- Be direct: \"X beats Y by $Z\" not \"X appears to outperform Y\"\n- Maximum 150 words total\n\nUse Google Search only if absolutely necessary for current market context.";

        return query;
    }

    // --- Send Message to Gemini ---
    async function sendChatMessage(userMessage) {
        if (!userMessage.trim()) return;

        // Add user message to UI and state
        appendChatMessage('user', userMessage);
        chatState.recentMessages.push({ role: 'user', content: userMessage });
        chatState.messageCount++;

        // Clear input
        chatElements.input.value = '';
        chatElements.input.style.height = 'auto';

        // Check if we need to summarize
        if (chatState.messageCount - chatState.lastSummarizedAt >= chatState.SUMMARIZE_THRESHOLD) {
            showChatLoading();
            removeChatLoading();

            // Show brief notification
            const notificationDiv = document.createElement('div');
            notificationDiv.className = 'chat-message model';
            notificationDiv.innerHTML = `
                <div class="chat-message-label">System</div>
                <div class="chat-message-content" style="background: #14b8a6; color: white; font-size: 0.85rem;">
                    Optimizing conversation context...
                </div>
            `;
            chatElements.messages.appendChild(notificationDiv);

            await summarizeConversation();

            // Remove notification after delay
            setTimeout(() => notificationDiv.remove(), 2000);
        }

        // Show loading
        showChatLoading();
        chatElements.sendBtn.disabled = true;

        try {
            const response = await fetch('/api/gemini-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemPrompt: chatState.systemPrompt,
                    compressedContext: chatState.compressedContext,
                    recentMessages: chatState.recentMessages
                })
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error?.message || err.error || `Server responded ${response.status}`);
            }

            const result = await response.json();
            const assistantMessage = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!assistantMessage) {
                throw new Error("No response received from Gemini.");
            }

            removeChatLoading();
            appendChatMessage('model', assistantMessage);
            chatState.recentMessages.push({ role: 'model', content: assistantMessage });
            chatState.messageCount++;

            // Update params indicator (in case user mentioned params in their question)
            updateParamsChangeIndicator();

        } catch (error) {
            console.error("Chat error:", error);
            removeChatLoading();
            appendChatMessage('model', "I apologize, but I encountered an error processing your request. Please try again.");
        } finally {
            chatElements.sendBtn.disabled = false;
        }
    }

    // --- Initial Analysis (Opens Chat) ---
    async function getGeminiAnalysis() {
        elements.geminiButton.disabled = true;
        elements.geminiButton.classList.add('opacity-50', 'cursor-not-allowed');

        // Open chat panel
        openChatPanel();

        // Capture current parameters
        chatState.lastAnalyzedParams = captureCurrentParams();

        // Generate initial query
        const initialQuery = generateFinancialReportQuery();

        // Add to state
        chatState.recentMessages.push({ role: 'user', content: initialQuery });
        chatState.messageCount++;

        // Show loading in chat
        showChatLoading();

        try {
            const response = await fetch('/api/gemini-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemPrompt: chatState.systemPrompt,
                    compressedContext: null,
                    recentMessages: chatState.recentMessages
                })
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error?.message || err.error || `Server responded ${response.status}`);
            }

            const result = await response.json();
            const analysisText = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!analysisText) {
                throw new Error("No content received from Gemini.");
            }

            removeChatLoading();
            appendChatMessage('model', analysisText);
            chatState.recentMessages.push({ role: 'model', content: analysisText });
            chatState.messageCount++;

        } catch (error) {
            console.error("Gemini API Error:", error);
            removeChatLoading();
            appendChatMessage('model', "There was an error generating the analysis. Please check the server logs and ensure GOOGLE_API_KEY is set on the server.");
        }
    }

    // --- Event Listeners for Chat ---
    function setupChatEventListeners() {
        // Send message
        chatElements.sendBtn.addEventListener('click', () => {
            const message = chatElements.input.value;
            sendChatMessage(message);
        });

        // Send on Enter (without Shift)
        chatElements.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const message = chatElements.input.value;
                sendChatMessage(message);
            }
        });

        // Auto-resize textarea
        chatElements.input.addEventListener('input', () => {
            chatElements.input.style.height = 'auto';
            chatElements.input.style.height = chatElements.input.scrollHeight + 'px';
        });

        // Toggle, minimize, close buttons
        chatElements.toggleBtn.addEventListener('click', openChatPanel);
        chatElements.minimizeBtn.addEventListener('click', minimizeChatPanel);
        chatElements.closeBtn.addEventListener('click', closeChatPanel);

        // Refresh analysis button
        chatElements.refreshAnalysisBtn.addEventListener('click', () => {
            const refreshQuery = generateFinancialReportQuery();
            sendChatMessage("I've updated the parameters. Here's the new scenario:\n\n" + refreshQuery);
            chatState.lastAnalyzedParams = captureCurrentParams();
            updateParamsChangeIndicator();
        });

        // Watch for parameter changes
        for (const key in inputGroups) {
            const slider = document.getElementById(inputGroups[key].slider);
            const numberInput = document.getElementById(inputGroups[key].number);

            slider.addEventListener('change', updateParamsChangeIndicator);
            numberInput.addEventListener('change', updateParamsChangeIndicator);
        }

        elements.home_price.addEventListener('change', updateParamsChangeIndicator);
        elements.household_income.addEventListener('change', updateParamsChangeIndicator);
        elements.initial_monthly_rent.addEventListener('change', updateParamsChangeIndicator);
        elements.rental_income_monthly.addEventListener('change', updateParamsChangeIndicator);
        elements.utilities_offset.addEventListener('change', updateParamsChangeIndicator);
        elements.reserve_cash.addEventListener('change', updateParamsChangeIndicator);
    }

    // --- UI Update Functions ---
    function updateDisplay() {
        const values = getValues();
        
        // Synchronize rental year slider with time horizon
        const startRentingYearSlider = document.getElementById('start_renting_year_slider');
        const startRentingYearNumber = document.getElementById('start_renting_year_number');
        startRentingYearSlider.max = values.time_horizon;
        startRentingYearNumber.max = values.time_horizon;
        if (parseInt(startRentingYearNumber.value) > values.time_horizon) {
            startRentingYearNumber.value = values.time_horizon;
            startRentingYearSlider.value = values.time_horizon;
        }

        // Toggle rental input fields
        if (values.start_renting_year > 0) {
            elements.rentalInputsContainer.style.opacity = '1';
            elements.rentalInputsContainer.querySelectorAll('input').forEach(i => i.disabled = false);
        } else {
            elements.rentalInputsContainer.style.opacity = '0.4';
            elements.rentalInputsContainer.querySelectorAll('input').forEach(i => i.disabled = true);
        }

        const { simulationData, monthlyCosts, ratios, rentalAnalysis, leverageAnalysis, reserveAnalysis } = calculateSimulation(values);
        // Update inline calculated displays next to sliders
        updateInlineCalcs(values, monthlyCosts);

        updateMonthlyExpenseUI(values, monthlyCosts, ratios, rentalAnalysis, reserveAnalysis);
        updateLeverageAnalysisUI(leverageAnalysis);
        updateResultsTableUI(simulationData);
        updateWealthChart(simulationData);
    }

    function safeSetText(el, text) {
        if (!el) return;
        el.textContent = text;
    }

    function updateReserveBreakdownCard(values) {
        if (!elements.reserve_breakdown_card) return;

        const downPaymentAmount = values.home_price * (values.down_payment_percent / 100);
        const renovationCosts = values.home_price * (values.renovation_percent / 100);
        const availableReserve = values.reserve_cash - downPaymentAmount - renovationCosts;

        // Update display values
        safeSetText(elements.reserve_total_display, formatter.format(values.reserve_cash));
        safeSetText(elements.reserve_minus_downpayment, '-' + formatter.format(downPaymentAmount));
        safeSetText(elements.reserve_minus_renovations, '-' + formatter.format(renovationCosts));
        safeSetText(elements.reserve_available_display, formatter.format(availableReserve));

        // Determine status and apply color coding
        elements.reserve_breakdown_card.className = elements.reserve_breakdown_card.className.replace(/status-\w+/g, '');

        if (availableReserve < 0) {
            elements.reserve_breakdown_card.classList.add('status-red');
            safeSetText(elements.reserve_status_label, 'INSUFFICIENT RESERVES:');
        } else if (availableReserve < downPaymentAmount * 0.1) { // Less than 10% of down payment
            elements.reserve_breakdown_card.classList.add('status-yellow');
            safeSetText(elements.reserve_status_label, 'Available for DTI Support:');
        } else {
            elements.reserve_breakdown_card.classList.add('status-green');
            safeSetText(elements.reserve_status_label, 'Available for DTI Support:');
        }
    }

    function updateInlineCalcs(values, monthlyCosts) {
        // Update reserve breakdown card
        updateReserveBreakdownCard(values);

        // Down payment absolute amount
        const downPaymentAmount = values.home_price * (values.down_payment_percent / 100);
        safeSetText(elements.down_payment_percent_calc, formatter.format(downPaymentAmount));

        // Interest rate — show monthly mortgage payment for given interest rate and loan amount as a quick reference
        const loanAmount = Math.max(0, values.home_price - downPaymentAmount);
        const r = (values.interest_rate_percent / 100) / 12;
        const n = 30 * 12;
        let monthlyPayment = 0;
        if (r > 0 && loanAmount > 0) {
            monthlyPayment = loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        } else if (loanAmount > 0) {
            monthlyPayment = loanAmount / n;
        }
        safeSetText(elements.interest_rate_percent_calc, monthlyPayment > 0 ? `${formatter.format(monthlyPayment)}/mo` : '—');

        // Property tax per month
        const monthlyPropertyTax = (values.home_price * (values.property_tax_rate_percent / 100)) / 12;
        safeSetText(elements.property_tax_rate_percent_calc, monthlyPropertyTax >= 0 ? `${formatter.format(monthlyPropertyTax)}/mo` : '—');

        // Insurance per month
        const monthlyInsurance = (values.home_price * (values.home_insurance_rate_percent / 100)) / 12;
        safeSetText(elements.home_insurance_rate_percent_calc, monthlyInsurance >= 0 ? `${formatter.format(monthlyInsurance)}/mo` : '—');

        // Maintenance per month
        const monthlyMaintenance = (values.home_price * (values.maintenance_rate_percent / 100)) / 12;
        safeSetText(elements.maintenance_rate_percent_calc, monthlyMaintenance >= 0 ? `${formatter.format(monthlyMaintenance)}/mo` : '—');

        // Closing costs absolute
        const closingCostsAmount = values.home_price * (values.closing_costs_percent / 100);
        safeSetText(elements.closing_costs_percent_calc, formatter.format(closingCostsAmount));

        // Home appreciation quick 1-year gain
        const oneYearAppreciation = values.home_price * (values.home_appreciation_rate_percent / 100);
        safeSetText(elements.home_appreciation_rate_percent_calc, formatter.format(oneYearAppreciation));

        // Rent increase — show example next-year rent
        const nextYearRent = values.initial_monthly_rent * (1 + values.annual_rent_increase_percent / 100);
        safeSetText(elements.annual_rent_increase_percent_calc, formatter.format(nextYearRent) + '/mo');

        // Tax rate — display a helper string
        safeSetText(elements.tax_rate_percent_calc, `${values.tax_rate_percent}%`);
        safeSetText(elements.pmi_rate_percent_calc, `${values.pmi_rate_percent}%`);

        // Renovation costs
        const renovationCosts = values.home_price * (values.renovation_percent / 100);
        safeSetText(elements.renovation_percent_calc, formatter.format(renovationCosts));

    }

    function updateMonthlyExpenseUI(values, monthlyCosts, ratios, rentalAnalysis, reserveAnalysis) {
        // Use effective_dti which accounts for reserve contributions
        const displayDTI = ratios.effective_dti;
        let dtiColor = 'text-green-400';
        if (displayDTI > 28 && displayDTI <= 36) {
            dtiColor = 'text-yellow-400';
        } else if (displayDTI > 36) {
            dtiColor = 'text-red-400';
        }

        // Show reserve contribution info if applicable
        const reserveInfo = monthlyCosts.month1_reserve_contribution > 0
            ? `<p class="text-xs text-teal-400 mt-1">Reserve Support: ${formatter.format(monthlyCosts.month1_reserve_contribution)}/mo</p>`
            : '';

        const dtiHtml = `
             <div class="bg-gray-700 p-4 rounded-lg h-full flex flex-col justify-center text-center">
                <h3 class="font-bold text-lg text-purple-400">Key Financial Ratios</h3>
                <p class="text-xs text-gray-400 mt-2">Effective Housing DTI</p>
                <p class="text-3xl font-bold ${dtiColor}">${displayDTI.toFixed(1)}%</p>
                 <p class="text-xs text-gray-500 mt-2">(Housing Costs / Gross Monthly Income)</p>
                 ${reserveInfo}
            </div>
        `;

        // Reserve Management Section
        let reserveManagementHtml = '';
        if (reserveAnalysis && reserveAnalysis.cumulative_reserve_used > 0) {
            const monthsRemaining = reserveAnalysis.reserve_depletion_month
                ? `Reserves depleted at month ${reserveAnalysis.reserve_depletion_month}`
                : `${Math.floor(reserveAnalysis.final_available_reserve / (reserveAnalysis.cumulative_reserve_used / 12))} months remaining`;

            const statusColor = reserveAnalysis.final_available_reserve > 0 ? 'text-green-400' : 'text-red-400';

            reserveManagementHtml = `
                <div class="bg-gray-700 p-4 rounded-lg h-full flex flex-col justify-center text-center mt-6 lg:mt-0">
                    <h3 class="font-bold text-lg text-yellow-400">Reserve Cash Status</h3>
                    <p class="text-xs text-gray-400 mt-2">Total Used: ${formatter.format(reserveAnalysis.cumulative_reserve_used)}</p>
                    <p class="text-2xl font-bold ${statusColor}">
                        ${formatter.format(reserveAnalysis.final_available_reserve)}
                    </p>
                    <p class="text-xs text-gray-500 mt-1">Remaining Balance</p>
                    <p class="text-xs text-gray-400 mt-2">${monthsRemaining}</p>
                </div>
            `;
        }

        const cashFlowHtml = values.start_renting_year > 0 ? `
            <div class="bg-gray-700 p-4 rounded-lg h-full flex flex-col justify-center text-center mt-6 lg:mt-0">
                <h3 class="font-bold text-lg text-teal-400">Homeowner Net Cash Flow</h3>
                <p class="text-xs text-gray-400 mt-0"> (Avg. during rental period)</p>
                <p class="text-3xl font-bold ${rentalAnalysis.average_annual_rental_cash_flow >= 0 ? 'text-white' : 'text-red-400'}">
                    ${formatter.format(rentalAnalysis.average_annual_rental_cash_flow / 12)} / month
                </p>
                 <p class="text-xs text-gray-500 mt-2">Profit from rental invested annually</p>
            </div>
        ` : ``;

        elements.monthlyExpenseOutput.innerHTML = `
            <h2 class="text-2xl font-bold text-white mb-4 text-center">First-Year Monthly Analysis</h2>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 text-center">
                    <div class="bg-gray-700 p-4 rounded-lg">
                        <h3 class="font-bold text-lg text-green-400 mb-2">Cost to Buy Breakdown</h3>
                        <div class="relative h-52 sm:h-48"><canvas id="monthlyCostChart"></canvas></div>
                    </div>
                    <div class="bg-gray-700 p-4 rounded-lg">
                        <h3 class="font-bold text-lg text-blue-400 mb-2">Cost to Rent Breakdown</h3>
                        <div class="relative h-52 sm:h-48"><canvas id="monthlyRentChart"></canvas></div>
                    </div>
                </div>
                <div class="flex flex-col justify-start">
                    ${dtiHtml}
                    ${reserveManagementHtml}
                    ${cashFlowHtml}
                </div>
            </div>`;
        
        renderMonthlyCostChart(monthlyCosts);
        renderMonthlyRentChart(monthlyCosts);
    }

    function updateLeverageAnalysisUI(leverageAnalysis) {
        elements.leverageAnalysisOutput.innerHTML = `
             <h2 class="text-2xl font-bold text-white mb-4 text-center">The Power of Leverage: Year 1 Analysis</h2>
             <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div class="bg-gray-700 p-6 rounded-lg space-y-3">
                    <div class="flex justify-between items-baseline">
                        <p class="text-gray-400">Gain from Appreciation:</p>
                        <p class="text-2xl font-bold text-green-400" id="leverage-appreciation">${formatter.format(leverageAnalysis.appreciation_gain_y1)}</p>
                    </div>
                    <div class="flex justify-between items-baseline border-t border-gray-600 pt-3">
                        <p class="text-gray-400">Principal Paid (Forced Savings):</p>
                        <p class="text-2xl font-bold text-green-400" id="leverage-principal">${formatter.format(leverageAnalysis.year1_principal_paid)}</p>
                    </div>
                    <div class="flex justify-between items-baseline border-t border-gray-600 pt-3">
                        <p class="font-semibold text-white">Total Equity Gained:</p>
                        <p class="text-2xl font-bold text-white" id="leverage-total-gain">${formatter.format(leverageAnalysis.total_equity_gain_y1)}</p>
                    </div>
                    <div class="flex justify-between items-baseline border-t-2 border-indigo-400 pt-3 mt-4">
                        <p class="font-semibold text-indigo-300">Leveraged Return on Equity:</p>
                        <p class="text-3xl font-bold text-indigo-300" id="leverage-roe">${leverageAnalysis.leveraged_roe.toFixed(2)}%</p>
                    </div>
                     <p class="text-xs text-gray-500 text-right">Based on a ${formatter.format(leverageAnalysis.down_payment)} down payment.</p>
                </div>
                <div class="relative h-72 md:h-80">
                    <canvas id="leverageChart"></canvas>
                </div>
             </div>
        `;
        renderLeverageChart(leverageAnalysis);
    }

    function updateResultsTableUI(simulationData) {
        let tableHTML = `<h2 class="text-2xl font-bold text-white mb-4 text-center">Wealth Projection Summary</h2>
                         <div class="overflow-x-auto"><table class="w-full text-sm text-left text-gray-400">`;

        const displayYears = [];
        const finalYear = simulationData.length;
        if (finalYear > 0) {
            for (let i = 5; i <= finalYear; i += 5) {
                displayYears.push(i);
            }
            if (finalYear % 5 !== 0 || finalYear < 5) {
                if (!displayYears.includes(finalYear)){
                    displayYears.push(finalYear);
                }
            }
        }

        let yearHeaders = displayYears.map(year => `<th scope="col" class="px-6 py-3 text-center">${'Year ' + year}</th>`).join('');
        tableHTML += `<thead class="text-xs text-gray-300 uppercase bg-gray-700"><tr>
                        <th scope="col" class="px-6 py-3 rounded-l-lg">Metric</th>
                        ${yearHeaders}
                      </tr></thead><tbody>`;

        const metrics = [
            { name: 'Homeowner Net Worth', key: 'buyer_net_worth', color: 'text-green-400' },
            { name: 'Renter Investments', key: 'renter_net_worth', color: 'text-blue-400' },
            { name: "Net Worth (Today's $)", key: 'buyer_net_worth_real', color: 'text-green-300' },
            { name: "Investments (Today's $)", key: 'renter_net_worth_real', color: 'text-blue-300' }
        ];

        metrics.forEach(metric => {
            tableHTML += `<tr class="bg-gray-800 border-b border-gray-700">
                            <th scope="row" class="px-6 py-4 font-medium text-white whitespace-nowrap">${metric.name}</th>`;
            displayYears.forEach(year => {
                const dataRow = simulationData.find(d => d.Year === year);
                if (dataRow) {
                    tableHTML += `<td class="px-6 py-4 text-center font-semibold ${metric.color}">${formatter.format(dataRow[metric.key])}</td>`;
                }
            });
            tableHTML += `</tr>`;
        });
        
        tableHTML += `</tbody></table></div>`;
        elements.resultsOutput.innerHTML = tableHTML;
    }

    // --- Chart Rendering Functions ---
    const centerTextPlugin = {
        id: 'centerText',
        afterDraw: (chart) => {
            if (chart.config.options.plugins.centerText?.display) {
                let ctx = chart.ctx;
                ctx.save();
                const text = chart.config.options.plugins.centerText.text;
                const color = chart.config.options.plugins.centerText.color || '#ffffff';
                const font = chart.config.options.plugins.centerText.font || '24px Inter';
                const x = (chart.chartArea.left + chart.chartArea.right) / 2;
                const y = (chart.chartArea.top + chart.chartArea.bottom) / 2;
                ctx.font = font;
                ctx.fillStyle = color;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(text, x, y);
                ctx.restore();
            }
        }
    };
    Chart.register(ChartDataLabels, centerTextPlugin);

    function renderMonthlyCostChart(monthlyCosts) {
        const monthlyCostCanvas = document.getElementById('monthlyCostChart')?.getContext('2d');
        if (monthlyCostChartInstance) monthlyCostChartInstance.destroy();
        if(monthlyCostCanvas) {
            monthlyCostChartInstance = new Chart(monthlyCostCanvas, {
                type: 'doughnut',
                data: {
                    labels: ['Mortgage (P&I)', 'Property Tax', 'Home Insurance', 'Maintenance', 'Utilities'],
                    datasets: [{
                        data: [monthlyCosts.mortgage, monthlyCosts.tax, monthlyCosts.insurance, monthlyCosts.maintenance, monthlyCosts.utilities],
                        backgroundColor: ['#6366f1', '#34d399', '#f87171', '#fbbf24', '#f472b6'],
                        borderColor: '#1f2937', borderWidth: 0
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, cutout: '60%',
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false },
                        centerText: { display: true, text: formatter.format(monthlyCosts.total_buyer), color: '#FFFFFF', font: 'bold 24px Inter' },
                        datalabels: {
                            formatter: (value, context) => {
                                if (value <= 0) return null;
                                const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                const percentage = (value / total) * 100;
                                if (percentage < 5) return null; 
                                const label = context.chart.data.labels[context.dataIndex];
                                return `${label}\n${percentage.toFixed(0)}%`;
                            },
                            color: '#FFFFFF',
                            anchor: 'end',
                            align: 'end',
                            offset: 8,
                            font: { size: 12, weight: '600' }
                        }
                    }
                }
            });
        }
    }

    function renderMonthlyRentChart(monthlyCosts) {
         const monthlyRentCanvas = document.getElementById('monthlyRentChart')?.getContext('2d');
         if (monthlyRentChartInstance) monthlyRentChartInstance.destroy();
         if (monthlyRentCanvas) {
             const investedDifference = Math.max(0, monthlyCosts.total_buyer - monthlyCosts.rent);
             monthlyRentChartInstance = new Chart(monthlyRentCanvas, {
                 type: 'doughnut',
                 data: {
                     labels: ['Rent Paid', 'Amount Invested'],
                     datasets: [{
                         data: [monthlyCosts.rent, investedDifference],
                         backgroundColor: ['#38bdf8', '#a78bfa'],
                         borderColor: '#1f2937',
                         borderWidth: 0
                     }]
                 },
                 options: {
                    responsive: true, maintainAspectRatio: false, cutout: '60%',
                     plugins: {
                         legend: { display: false },
                         tooltip: { enabled: false },
                         centerText: { display: true, text: formatter.format(monthlyCosts.rent), color: '#FFFFFF', font: 'bold 24px Inter' },
                         datalabels: {
                            formatter: (value, context) => {
                                if (value <= 0) return null; 
                                const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                const percentage = (value / total) * 100;
                                if (percentage < 5) return null; 
                                const label = context.chart.data.labels[context.dataIndex];
                                return `${label}\n${percentage.toFixed(0)}%`;
                            },
                            color: '#FFFFFF',
                            anchor: 'end',
                            align: 'end',
                            offset: 8,
                            font: { size: 12, weight: '600' }
                        }
                     }
                 }
             });
         }
    }
     
    function renderLeverageChart(leverageAnalysis) {
        const leverageCanvas = document.getElementById('leverageChart')?.getContext('2d');
        const values = getValues();
        if(leverageChartInstance) leverageChartInstance.destroy();
        if(leverageCanvas) {
            leverageChartInstance = new Chart(leverageCanvas, {
                type: 'bar',
                data: {
                    labels: ['Leveraged ROE', 'Real ROE (Adjusted)', 'Market Return'],
                    datasets: [{
                        label: 'Year 1 Return Comparison',
                        data: [leverageAnalysis.leveraged_roe, leverageAnalysis.real_leveraged_roe, values.market_investment_return_percent],
                        backgroundColor: ['#6366f1', '#818cf8', '#38bdf8'],
                        borderRadius: 5,
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    indexAxis: 'y',
                    scales: {
                       x: { ticks: { color: '#9ca3af', callback: (value) => `${value}%`}, grid: { color: 'rgba(255, 255, 255, 0.1)'}},
                       y: { ticks: { color: '#d1d5db', font: {size: 14} }, grid: { display: false }}
                    },
                    plugins: {
                        legend: {display: false},
                        tooltip: {enabled: false},
                        datalabels: {
                             formatter: (value) => `${value.toFixed(2)}%`,
                             color: '#FFFFFF',
                             anchor: 'end',
                             align: 'end',
                             offset: -8,
                             font: { size: 14, weight: 'bold' }
                        }
                    }
                }
            });
        }
    }

    function updateWealthChart(simulationData) {
        if (wealthChartInstance) wealthChartInstance.destroy();
        wealthChartInstance = new Chart(elements.wealthChartCanvas, {
            type: 'line',
            data: {
                labels: simulationData.map(d => d.Year),
                datasets: [{
                    label: 'Homeowner Net Worth (Nominal)', data: simulationData.map(d => d.buyer_net_worth),
                    borderColor: '#4ade80', backgroundColor: 'rgba(74, 222, 128, 0.1)', fill: false, tension: 0.3, pointRadius: 0, pointHoverRadius: 5
                }, {
                    label: 'Renter Investments (Nominal)', data: simulationData.map(d => d.renter_net_worth),
                    borderColor: '#60a5fa', backgroundColor: 'rgba(96, 165, 250, 0.1)', fill: false, tension: 0.3, pointRadius: 0, pointHoverRadius: 5
                },{
                    label: 'Homeowner Net Worth (Real)', data: simulationData.map(d => d.buyer_net_worth_real),
                    borderColor: '#86efac', backgroundColor: 'rgba(134, 239, 172, 0.1)', fill: false, tension: 0.3, borderDash: [5, 5], pointRadius: 0, pointHoverRadius: 5
                }, {
                    label: 'Renter Investments (Real)', data: simulationData.map(d => d.renter_net_worth_real),
                    borderColor: '#93c5fd', backgroundColor: 'rgba(147, 197, 253, 0.1)', fill: false, tension: 0.3, borderDash: [5, 5], pointRadius: 0, pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { color: '#9ca3af', callback: (value) => formatter.format(value) }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                    x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
                },
                plugins: { 
                    legend: { labels: { color: '#d1d5db' } }, 
                    tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${formatter.format(context.raw)}` } },
                    datalabels: {
                        display: false
                    }
                }
            }
        });
    }
    
    function renderBuyingPowerChart() {
        // Data sourced from FRED, St. Louis Fed, and other public datasets.
        const historicalData = {
            years: [1980, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
            medianHomePrice: [64600, 84300, 122900, 133900, 169000, 240900, 222900, 296400, 400400, 513000],
            medianIncome: [21020, 27735, 35353, 40611, 41990, 46326, 49276, 55775, 67521, 74580],
            mortgageRate: [13.74, 12.43, 10.13, 7.93, 8.05, 5.87, 4.69, 3.85, 2.96, 6.99]
        };
        
        const priceToIncomeRatio = historicalData.medianHomePrice.map((price, i) => price / historicalData.medianIncome[i]);

        if (buyingPowerChartInstance) buyingPowerChartInstance.destroy();
        buyingPowerChartInstance = new Chart(elements.buyingPowerChartCanvas, {
            type: 'bar',
            data: {
                labels: historicalData.years,
                datasets: [
                     {
                        label: 'Home Price-to-Income Ratio',
                        data: priceToIncomeRatio,
                        backgroundColor: '#fbbf24',
                        yAxisID: 'yRate',
                        order: 2
                    },
                    {
                        label: 'Median Home Price',
                        data: historicalData.medianHomePrice,
                        borderColor: '#f87171',
                        yAxisID: 'yPrice',
                        type: 'line',
                        tension: 0.1,
                        order: 1
                    },
                     {
                        label: 'Median Household Income',
                        data: historicalData.medianIncome,
                        borderColor: '#34d399',
                        yAxisID: 'yPrice',
                         type: 'line',
                        tension: 0.1,
                         order: 0
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    yPrice: {
                        type: 'linear', position: 'left',
                        beginAtZero: true,
                        ticks: { color: '#9ca3af', callback: (value) => formatter.format(value) },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    yRate: {
                        type: 'linear', position: 'right',
                        beginAtZero: true,
                        max: Math.max(...priceToIncomeRatio) * 1.2,
                        ticks: { color: '#facc15', callback: (value) => `${value.toFixed(1)}x` },
                        grid: { drawOnChartArea: false },
                         title: { display: true, text: 'Years of Income to Buy a Home', color: '#facc15'}
                    },
                    x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
                },
                plugins: { 
                    legend: { labels: { color: '#d1d5db' } }, 
                    tooltip: { mode: 'index', intersect: false, callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.dataset.yAxisID === 'yPrice') {
                                label += formatter.format(context.raw);
                            } else {
                                label += context.raw.toFixed(2) + 'x';
                            }
                            return label;
                        }
                    }},
                    datalabels: { display: false }
                }
            }
        });
    }

    // --- Event Listener Setup ---
    function setupEventListeners() {
        elements.home_price.addEventListener('input', updateDisplay);
        elements.household_income.addEventListener('input', updateDisplay);
        elements.initial_monthly_rent.addEventListener('input', updateDisplay);
        elements.rental_income_monthly.addEventListener('input', updateDisplay);
        elements.utilities_offset.addEventListener('input', updateDisplay);
        elements.reserve_cash.addEventListener('input', updateDisplay);
        elements.geminiButton.addEventListener('click', getGeminiAnalysis);

        for (const key in inputGroups) {
            const slider = document.getElementById(inputGroups[key].slider);
            const number = document.getElementById(inputGroups[key].number);
            
            slider.addEventListener('input', () => {
                number.value = slider.value;
                updateDisplay();
            });
            number.addEventListener('input', () => {
                slider.value = number.value;
                updateDisplay();
            });
        }
    }
    
    // --- App Initialization ---
    function init() {
        setupEventListeners();
        setupChatEventListeners();
        updateDisplay();
        renderBuyingPowerChart();
    }

    document.addEventListener('DOMContentLoaded', init);

})();