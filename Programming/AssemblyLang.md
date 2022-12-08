```asm
.global _boot
_boot:
	incr x0
	jump_eq 0x, 0x3E8, kill
	nop
	
kill:
	nop
