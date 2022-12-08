```axsm
bits 16

_start:
	incr x0
	jump_eq x0, 0x3E8, kill
	nop
	jump _start
	
kill:
	hlt
```

The above program will excute in the following patteren.
 - Set the architech mode to 16 bits
 - First the CPU will find the address of `_start` which is `0x00` and will start executing it.
 - Inside it will increment the value in the `x0` register so that the value inside of `0x1`.
 - Then the CPU will check to see if the value in the `x0` register is equal to `0x3E8` which means 1000, it will not jump.
 - The jump was skipped so the CPU executes a `NOP` instruction.
 - The CPU will jump to `_start` and incremement again. 
 - This will keep happening until the value is 1000 or `0x3E8`.
 - Once the value is met, the jump will trigger and start executing at `kill`.
 - The `kill` function calls the CPU terminate call and the device processor will trigger the PSU to shut down.


Depending on the clock speed, a certain amount of observable time will be spent.
