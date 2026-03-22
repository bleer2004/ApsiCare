import pickle
import os
import numpy as np
import matplotlib.pyplot as plt

DATA_PATH = r"C:\Users\eduar\Desktop\TCC-Códigos\Git-TCC\PsicoCare\dataset\WESAD"

subject = "S2"
file = os.path.join(DATA_PATH, subject, f"{subject}.pkl")

with open(file, "rb") as f:
    data = pickle.load(f, encoding="latin1")

# pegar sinais do wrist
eda = data['signal']['wrist']['EDA'].flatten()
temp = data['signal']['wrist']['TEMP'].flatten()
bvp = data['signal']['wrist']['BVP'].flatten()
acc = data['signal']['wrist']['ACC']  # (n, 3)

# criar eixo de tempo em segundos
# EDA e TEMP = 4Hz, BVP = 64Hz, ACC = 32Hz
t_eda = np.arange(len(eda)) / 4
t_bvp = np.arange(len(bvp)) / 64
t_acc = np.arange(len(acc)) / 32

fig, axes = plt.subplots(4, 1, figsize=(15, 10), sharex=False)
fig.suptitle("S2 — Sinais Wrist", fontsize=14)

axes[0].plot(t_eda, eda, color='blue')
axes[0].set_title("EDA (sudorese)")
axes[0].set_ylabel("µS")

axes[1].plot(t_eda, temp, color='red')
axes[1].set_title("TEMP (temperatura)")
axes[1].set_ylabel("°C")

axes[2].plot(t_bvp, bvp, color='green')
axes[2].set_title("BVP (freq. cardíaca)")
axes[2].set_ylabel("amplitude")

axes[3].plot(t_acc, acc[:, 0], label='x')
axes[3].plot(t_acc, acc[:, 1], label='y')
axes[3].plot(t_acc, acc[:, 2], label='z')
axes[3].set_title("ACC (movimento)")
axes[3].set_ylabel("g")
axes[3].legend()

for ax in axes:
    ax.set_xlabel("tempo (s)")

plt.tight_layout()
plt.savefig("explore_data/wesad_s2_wrist.png", dpi=150)
plt.show()