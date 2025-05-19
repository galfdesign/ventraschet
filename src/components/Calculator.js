import React, { useState, useEffect } from 'react';
import { cityData } from '../data/cityData';
import { energyPrices } from '../data/energyPrices';
import '../styles/Calculator.css';

function Calculator() {
    const [selectedCity, setSelectedCity] = useState('spb');
    const [airFlow, setAirFlow] = useState(100);
    const [tempIn, setTempIn] = useState(20);
    const [tempOut, setTempOut] = useState(-20);
    const [recupEfficiency, setRecupEfficiency] = useState(70);
    const [nightTariff, setNightTariff] = useState(false);
    const [results, setResults] = useState({
        energy: 0,
        electricCost: 0,
        gasCost: 0,
        electricCostRecup: 0,
        gasCostRecup: 0,
        heatingMonths: 0,
        heatingHours: 0
    });
    const [showFormula, setShowFormula] = useState(false);

    useEffect(() => {
        calculate();
    }, [selectedCity, airFlow, tempIn, tempOut, recupEfficiency, nightTariff]);

    const calculate = () => {
        const city = cityData.find(c => c.id === selectedCity);
        const prices = energyPrices[selectedCity];
        
        if (!city || !prices) return;

        // Длительность отопительного периода (в часах)
        const heatingMonths = city.heatingPeriodMonths || 7;
        const heatingHours = heatingMonths * 30 * 24;

        // Расчет необходимой энергии для нагрева воздуха (за 1 час)
        const airDensity = 1.2; // кг/м³
        const specificHeat = 1.005; // кДж/(кг·°C)
        const tempDiff = tempIn - (city.coldFiveDaysTemp || -20); // для расчета используем разницу с холодной пятидневкой
        const energyPerHour = (airFlow * airDensity * specificHeat * tempDiff) / 3600;
        const energy = energyPerHour * heatingHours;

        // Расчет стоимости нагрева электричеством с учётом ночного тарифа
        let electricCost;
        let electricCostRecup;
        if (nightTariff) {
            // 8 часов в сутки по цене в 2 раза ниже, 16 часов — по обычной цене
            const nightHours = 8 * heatingMonths * 30; // 8 часов * дней
            const dayHours = heatingHours - nightHours;
            const nightEnergy = energyPerHour * nightHours;
            const dayEnergy = energyPerHour * dayHours;
            electricCost = (nightEnergy * (prices.electricPrice / 2)) + (dayEnergy * prices.electricPrice);
            // С рекуператором
            const energyRecupPerHour = energyPerHour * (1 - recupEfficiency / 100);
            const nightEnergyRecup = energyRecupPerHour * nightHours;
            const dayEnergyRecup = energyRecupPerHour * dayHours;
            electricCostRecup = (nightEnergyRecup * (prices.electricPrice / 2)) + (dayEnergyRecup * prices.electricPrice);
        } else {
            electricCost = energy * prices.electricPrice;
            const energyRecup = energy * (1 - recupEfficiency / 100);
            electricCostRecup = energyRecup * prices.electricPrice;
        }

        // Расчет стоимости нагрева газом
        const gasEfficiency = 0.9; // КПД газового котла
        const gasCost = (energy / gasEfficiency) * prices.gasPrice;
        // Расчет с учетом рекуператора
        const energyRecup = energy * (1 - recupEfficiency / 100);
        const gasCostRecup = (energyRecup / gasEfficiency) * prices.gasPrice;

        setResults({
            energy,
            electricCost,
            gasCost,
            electricCostRecup,
            gasCostRecup,
            heatingMonths,
            heatingHours
        });
    };

    return (
        <div className="calculator">
            <div className="calc-header">
                <h1>Расчет затрат на подогрев приточного воздуха</h1>
            </div>

            <div className="input-group">
                <label htmlFor="city">Город</label>
                <select 
                    id="city" 
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                >
                    {cityData.map(city => (
                        <option key={city.id} value={city.id}>
                            {city.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="input-group">
                <label htmlFor="airFlow">Расход воздуха (м³/ч)</label>
                <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                    <input
                        type="range"
                        id="airFlow"
                        min="0"
                        max="5000"
                        step="10"
                        value={airFlow}
                        onChange={e => setAirFlow(Number(e.target.value))}
                        style={{flex: 1}}
                    />
                    <input
                        type="number"
                        min="0"
                        max="5000"
                        step="10"
                        value={airFlow}
                        onChange={e => setAirFlow(Number(e.target.value))}
                        style={{width: 80}}
                    />
                </div>
            </div>

            <div className="input-group">
                <label htmlFor="tempIn">Температура приточного воздуха (°C)</label>
                <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                    <input
                        type="range"
                        id="tempIn"
                        min="-30"
                        max="40"
                        step="1"
                        value={tempIn}
                        onChange={e => setTempIn(Number(e.target.value))}
                        style={{flex: 1}}
                    />
                    <input
                        type="number"
                        min="-30"
                        max="40"
                        step="1"
                        value={tempIn}
                        onChange={e => setTempIn(Number(e.target.value))}
                        style={{width: 60}}
                    />
                </div>
            </div>

            <div className="input-group">
                <label htmlFor="recupEfficiency">КПД рекуператора (%)</label>
                <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                    <input
                        type="range"
                        id="recupEfficiency"
                        min="0"
                        max="100"
                        step="1"
                        value={recupEfficiency}
                        onChange={e => setRecupEfficiency(Number(e.target.value))}
                        style={{flex: 1}}
                    />
                    <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={recupEfficiency}
                        onChange={e => setRecupEfficiency(Number(e.target.value))}
                        style={{width: 60}}
                    />
                </div>
            </div>

            <div className="input-group">
                <label style={{display: 'flex', alignItems: 'center', gap: 10}}>
                    <span className="switch">
                        <input
                            type="checkbox"
                            checked={nightTariff}
                            onChange={e => setNightTariff(e.target.checked)}
                        />
                        <span className="slider"></span>
                    </span>
                    <span className="switch-label">Ночной тариф</span>
                </label>
            </div>

            <div className="results">
                <div className="result-item">
                    <strong>Температура холодной пятидневки</strong>
                    <div>{cityData.find(c => c.id === selectedCity)?.coldFiveDaysTemp} °C</div>
                </div>
                <div className="result-item">
                    <strong>Затраты на подогрев за счет электричества:</strong>
                    <div>{results.electricCost.toFixed(0)} руб за отопительный период</div>
                </div>
                <div className="result-item">
                    <strong>Затраты на подогрев за счет газа:</strong>
                    <div>{results.gasCost.toFixed(0)} руб за отопительный период</div>
                </div>
                <div className="result-item">
                    <strong>Затраты на подогрев за счет электричества с рекуператором:</strong>
                    <div>{results.electricCostRecup.toFixed(0)} руб за отопительный период (экономия {(results.electricCost - results.electricCostRecup).toFixed(0)} руб)</div>
                </div>
                <div className="result-item">
                    <strong>Затраты на подогрев за счет газа с рекуператором:</strong>
                    <div>{results.gasCostRecup.toFixed(0)} руб за отопительный период (экономия {(results.gasCost - results.gasCostRecup).toFixed(0)} руб)</div>
                </div>
                <div className="result-item">
                    <strong>Тарифы для {cityData.find(c => c.id === selectedCity)?.name}</strong>
                    <div>Электричество: {energyPrices[selectedCity].electricPrice} руб/кВт·ч</div>
                    <div>Газ: {energyPrices[selectedCity].gasPrice} руб/кВт·ч</div>
                </div>
            </div>

            <div className="annotation-bottom">
                <button className="annotation-btn" title="Показать формулы расчёта" onClick={() => setShowFormula(true)}>
                    <span role="img" aria-label="Формулы">❓</span>
                </button>
            </div>

            {showFormula && (
                <div className="modal-formula" onClick={() => setShowFormula(false)}>
                    <div className="modal-content formula-annotation" onClick={e => e.stopPropagation()}>
                        <button className="close-modal" onClick={() => setShowFormula(false)} title="Закрыть">×</button>
                        <h2>Формулы расчёта</h2>
                        <div className="formula-card">
                            <div className="formula-title">1. Расчет необходимой энергии для нагрева воздуха</div>
                            Q = V × ρ × c × ΔT
                            <ul>
                                <li>Q — необходимая энергия (кВт·ч)</li>
                                <li>V — расход воздуха (м³/ч)</li>
                                <li>ρ — плотность воздуха (1.2 кг/м³)</li>
                                <li>c — удельная теплоёмкость воздуха (1.005 кДж/(кг·°C))</li>
                                <li>ΔT — разница температур (в помещении − на улице)</li>
                            </ul>
                            <div style={{marginTop: 6}}>Упрощённая формула: Q = (V × 1.2 × 1.005 × ΔT) / 3600</div>
                        </div>
                        <div className="formula-card">
                            <div className="formula-title">2. Расчет стоимости нагрева электричеством</div>
                            Стоимость = Q × Цена_электричества
                            <ul>
                                <li>Цена_электричества — тариф для выбранного города</li>
                            </ul>
                        </div>
                        <div className="formula-card">
                            <div className="formula-title">3. Расчет стоимости нагрева газом</div>
                            Стоимость = (Q / КПД_котла) × Цена_газа
                            <ul>
                                <li>КПД_котла — обычно 0.9</li>
                                <li>Цена_газа — тариф для выбранного города</li>
                            </ul>
                        </div>
                        <div className="formula-card">
                            <div className="formula-title">4. Расчет с учетом рекуператора</div>
                            Q<sub>рекуп</sub> = Q × (1 - η)
                            <ul>
                                <li>η — КПД рекуператора (%)</li>
                            </ul>
                            <div>Далее расчёт стоимости аналогичен, но с Q<sub>рекуп</sub></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Calculator; 